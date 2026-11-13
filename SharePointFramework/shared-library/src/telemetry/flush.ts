import { drainTelemetryBatches } from './batch'
import {
  GATE_MAX_AGE_MS,
  ITelemetryBatch,
  MAX_SENDS_PER_WINDOW,
  MIN_SEND_INTERVAL_MS,
  USAGE_TELEMETRY_URL
} from './contract'
import { ITelemetryGate, readTelemetrySignals, resolveTelemetryGate } from './gate'
import { ensureTelemetryHeartbeat } from './heartbeat'
import { ensureTelemetrySiteInfo } from './siteInfo'
import {
  currentTelemetryDecision,
  getTelemetryStore,
  ITelemetryAnchor,
  ITelemetryPortal,
  ITelemetryStore,
  pruneTelemetryStore
} from './store'
import { normalizeGuid } from './validate'

/** Swallows a rejection: telemetry never retries and never reports its own failures. */
function ignore(): void {
  return undefined
}

/** Whether the value can be read as a settings map. */
function isSettingsMap(settings: unknown): settings is Map<string, string> {
  const map = settings as Map<string, string>
  return !!map && typeof map.has === 'function' && typeof map.get === 'function'
}

/**
 * Whether a caller handed over settings it has read. An empty map tells nothing: a data adapter's
 * map is empty when the hub gave no settings, and also when the adapter never read them
 * (`loadGlobalSettings`). Taken as the hub's answer, the second would close the gate for every
 * bundle on the page. It is taken as no map, and the anchor's own read decides.
 */
function hasReadSettings(settings: unknown): settings is Map<string, string> {
  return isSettingsMap(settings) && settings.size > 0
}

/** The gate's answer for the anchor and a settings map, with the browser's signals as they are. */
function gateFor(anchor: ITelemetryAnchor, settings: Map<string, string> | undefined) {
  return resolveTelemetryGate({
    ...readTelemetrySignals(),
    hasAnchor: true,
    anchorAvailable: anchor.portal.isAvailable === true,
    settings: isSettingsMap(settings) ? settings : undefined
  })
}

/** The lower of two answers: the lower level and its reason, the catalog only if both allow it. */
function lowerOf(gate: ITelemetryGate, other: ITelemetryGate): ITelemetryGate {
  const lowest = other.level < gate.level ? other : gate
  return { level: lowest.level, reason: lowest.reason, catalog: gate.catalog && other.catalog }
}

/**
 * Makes the anchor's answer the store's decision, unless the page has moved to another hub since
 * the answer was asked for. What was collected above the level is dropped, at level 2 and up the
 * lookups of the sites in memory start, and at level 1 and up a heartbeat that was asked for
 * while the gate was pending is read and sent.
 */
function decide(store: ITelemetryStore, anchor: ITelemetryAnchor, gate: ITelemetryGate): void {
  if (store.anchor !== anchor) return
  const now = Date.now()
  const { level, catalog, reason } = store.gateCap ? lowerOf(gate, store.gateCap) : gate
  store.gateCap = undefined
  store.decision = { level, catalog, reason, at: now, hubSiteId: anchor.hubSiteId }
  pruneTelemetryStore(store, level)
  ensureTelemetrySiteInfo(store, now)
  ensureTelemetryHeartbeat(store, now, flushTelemetryNow)
}

/**
 * Reads the settings through the anchor, in the background, and decides from them. The read is the
 * app's own cached `getGlobalSettings`; one that fails closes the gate.
 */
function readGate(store: ITelemetryStore, anchor: ITelemetryAnchor): void {
  if (store.gateReadFor === anchor) return
  store.gateReadFor = anchor
  const settle = (settings?: Map<string, string>): void => {
    if (store.gateReadFor === anchor) store.gateReadFor = undefined
    decide(store, anchor, gateFor(anchor, settings))
  }
  Promise.resolve()
    .then(() => anchor.portal.getGlobalSettings())
    .then(settle, () => settle())
    .catch(ignore)
}

/**
 * Lowers the gate by a settings map another bundle holds. Such a map never opens or raises the
 * gate: before the anchor's own answer it is kept as a cap on that answer.
 */
function lowerGate(
  store: ITelemetryStore,
  anchor: ITelemetryAnchor,
  settings: Map<string, string>
): void {
  const gate = gateFor(anchor, settings)
  const { decision } = store
  if (!decision) {
    store.gateCap = store.gateCap ? lowerOf(store.gateCap, gate) : gate
    return
  }
  const lowered = lowerOf(decision, gate)
  decision.level = lowered.level
  decision.reason = lowered.reason
  decision.catalog = lowered.catalog
  pruneTelemetryStore(store, decision.level)
}

/**
 * Closes a decision that the browser's signals have overruled since it was made: the tester flag,
 * Global Privacy Control or Do Not Track. A decision is used for up to `GATE_MAX_AGE_MS`, and a
 * signal that appears in that time must stop the next send, not the one after the next settings
 * read. The gate's own first two rules decide, and what was counted is dropped. Only the flag and
 * two properties of `navigator` are read, never the network, so a flush still works from memory.
 */
function closeOnSignals(store: ITelemetryStore): void {
  const { decision } = store
  if (!decision || decision.level === 0) return
  const { reason } = resolveTelemetryGate({
    ...readTelemetrySignals(),
    hasAnchor: false,
    anchorAvailable: false
  })
  if (reason !== 'tester-flag' && reason !== 'privacy-signal') return
  decision.level = 0
  decision.catalog = false
  decision.reason = reason
  pruneTelemetryStore(store, 0)
}

/**
 * Gives telemetry the hub's data service, after the bundle's data adapter is configured. Call
 * `startTelemetry` first.
 *
 * Only a portal of the page's own hub is accepted: its `hubSiteId`, without braces and in
 * lowercase, must equal the page's, and an empty hub id never matches. So a portal configured with
 * another portfolio's URL never decides the level or the hub URL. The first accepted portal becomes
 * the anchor: the only portal telemetry reads through, and the source of the hub URL. With
 * `settings` (the map the caller already read with `getGlobalSettings`) the gate is decided at
 * once, otherwise after the anchor's own cached read. A map that comes with a later portal may
 * only lower the decision, never raise it. An empty map counts as none (`hasReadSettings`): pass
 * the map only when the bundle has read the settings, and leave it out otherwise.
 *
 * @param portal The bundle's `PortalDataService`
 * @param settings The global settings the caller already holds
 */
export function attachTelemetryPortal(
  portal: ITelemetryPortal,
  settings?: Map<string, string>
): void {
  try {
    const store = getTelemetryStore()
    if (!store || !store.page || !portal) return
    const hubSiteId = normalizeGuid(portal.hubSiteId)
    if (!hubSiteId || hubSiteId !== store.page.hubSiteId) return
    if (store.anchor) {
      if (hasReadSettings(settings)) lowerGate(store, store.anchor, settings)
      return
    }
    const anchor: ITelemetryAnchor = { portal, hubSiteId }
    store.anchor = anchor
    if (hasReadSettings(settings)) decide(store, anchor, gateFor(anchor, settings))
    else readGate(store, anchor)
  } catch {
    // Telemetry never breaks the code that reports to it.
  }
}

/**
 * The gate's answer for a sender right now, the catalog included. Closed (level 0) until the
 * anchor's settings are read, when the decision is older than `GATE_MAX_AGE_MS`, on a page of
 * another hub than the decision was made for, and from the moment the tester flag or a privacy
 * signal of the browser is set.
 *
 * The lookup is synchronous and never waits. One that finds the decision too old starts the
 * settings read in the background, as a tracking call does, and answers closed: a sender that
 * only asks the gate, like the catalog's, gets the new answer the next time it asks.
 */
export function getTelemetryGate(): ITelemetryGate {
  try {
    const store = getTelemetryStore()
    if (store) closeOnSignals(store)
    refreshTelemetryGate()
    const decision = store && currentTelemetryDecision(store, Date.now())
    if (decision) {
      return { level: decision.level, catalog: decision.catalog, reason: decision.reason }
    }
  } catch {
    // Closed below.
  }
  return { level: 0, catalog: false, reason: 'pending' }
}

/**
 * Reads the settings again, in the background, when the decision is older than `GATE_MAX_AGE_MS`.
 * Until the answer is in, nothing is sent.
 */
export function refreshTelemetryGate(): void {
  try {
    const store = getTelemetryStore()
    if (!store || !store.anchor || !store.decision) return
    const age = Date.now() - store.decision.at
    if (age < 0 || age > GATE_MAX_AGE_MS) readGate(store, store.anchor)
  } catch {
    // The decision stays stale, and nothing is sent.
  }
}

/** A random id for one batch. It is never stored, and links nothing to anything. */
function createBatchId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().toLowerCase()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    return (character === 'x' ? random : (random % 4) + 8).toString(16)
  })
}

/**
 * Posts one batch to Assist, without waiting for the answer and without a retry. `keepalive` lets
 * the request outlive the page, `text/plain` keeps it a CORS simple request (no preflight),
 * `credentials: 'omit'` keeps cookies out and `no-referrer` keeps the page's URL out. A DEBUG build
 * logs the batch instead.
 */
function sendBatch(store: ITelemetryStore, batch: ITelemetryBatch, now: number): void {
  if (store.sendCount >= MAX_SENDS_PER_WINDOW) return
  store.sendCount++
  store.lastSendAt = now
  try {
    if (store.page.isDebug) {
      // eslint-disable-next-line no-console -- a DEBUG build shows what it would have sent
      console.info('(pp365) Usage statistics batch, not sent from a DEBUG build:', batch)
      return
    }
    const request = fetch(USAGE_TELEMETRY_URL, {
      method: 'POST',
      body: JSON.stringify(batch),
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      mode: 'cors',
      headers: { 'content-type': 'text/plain;charset=UTF-8' }
    })
    Promise.resolve(request).catch(ignore)
  } catch {
    // No retry: the batch is lost.
  }
}

/**
 * Sends what is in memory, as far as the gate's decision allows. The batch is built from memory and
 * the network is never awaited, so a flush can run as the page closes, reloads or navigates.
 *
 * An urgent flush always sends: call it right before code reloads or leaves the page. A flush that
 * is not urgent (a tab that is hidden) sends only when the last send is at least
 * `MIN_SEND_INTERVAL_MS` old; until then the counters keep summing. A window sends at most
 * `MAX_SENDS_PER_WINDOW` requests. Nothing is sent without a decision for the page's hub, and what
 * cannot be sent yet stays in memory. The tester flag and the browser's privacy signals are read
 * again first: one that was set after the decision closes the gate, and nothing is sent.
 *
 * @param options `urgent` to send regardless of the time since the last send
 */
export function flushTelemetry(options?: { urgent?: boolean }): void {
  try {
    const store = getTelemetryStore()
    if (!store) return
    closeOnSignals(store)
    if (store.sendCount >= MAX_SENDS_PER_WINDOW) return
    const now = Date.now()
    const sinceLastSend = now - store.lastSendAt
    if (!options?.urgent && sinceLastSend >= 0 && sinceLastSend < MIN_SEND_INTERVAL_MS) return
    drainTelemetryBatches(store, now, createBatchId).forEach((batch) =>
      sendBatch(store, batch, now)
    )
    ensureTelemetrySiteInfo(store, now)
  } catch {
    // Telemetry never breaks the code that reports to it.
  }
}

/** Sends what is in memory at once, whatever the time since the last send. */
export function flushTelemetryNow(): void {
  flushTelemetry({ urgent: true })
}

/** A hidden tab may be closed without another event: send, if the last send is old enough. */
function onVisibilityChange(): void {
  if (document.visibilityState === 'hidden') flushTelemetry()
  else refreshTelemetryGate()
}

/** The page is going away: send what is in memory. */
function onPageHide(): void {
  flushTelemetryNow()
}

/**
 * Installs the listeners that flush, once per window however many bundles start telemetry: on
 * `visibilitychange` to hidden and on `pagehide`. A tab that becomes visible again reads the
 * settings anew if its decision has grown old.
 */
export function installTelemetryListeners(): void {
  const store = getTelemetryStore()
  if (!store || store.listenersInstalled || typeof document === 'undefined') return
  store.listenersInstalled = true
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', onPageHide)
}
