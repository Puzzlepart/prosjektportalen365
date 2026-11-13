import { isHubSite } from '../util/isHubSite'
import {
  MAX_ENTRY_COUNT,
  TELEMETRY_TIMING_BUCKETS,
  TelemetryComponent,
  TelemetryEvent,
  TelemetryEventComponent,
  TelemetryHubLanguage,
  TelemetrySiteType,
  TelemetryTimingMetric,
  TelemetryVariant
} from './contract'
import { errorCodeFrom, errorHttpStatusFrom } from './errorCode'
import {
  flushTelemetry,
  flushTelemetryNow,
  installTelemetryListeners,
  refreshTelemetryGate
} from './flush'
import { ensureTelemetryHeartbeat } from './heartbeat'
import { ensureTelemetrySiteInfo, TelemetryResolvedSiteType } from './siteInfo'
import {
  getTelemetryStore,
  isTelemetryLevelClosed,
  ITelemetryPage,
  ITelemetryStore,
  resetTelemetryHub
} from './store'
import {
  isTelemetryComponent,
  isTelemetryErrorCode,
  isTelemetrySiteType,
  isTelemetryTimingMetric,
  isTelemetryUsage,
  normalizeGuid,
  normalizeHost,
  normalizeVersion,
  sanitizeHeartbeat,
  TelemetryHeartbeatInput,
  timingBucketOf
} from './validate'

/** What a bundle tells telemetry about the page it runs on, as plain values. */
export interface ITelemetryInit {
  /** The host of the page's web, e.g. `contoso.sharepoint.com` */
  host: string
  /** The tenant's id (`legacyPageContext.aadTenantId`) */
  tenantId?: string
  /** The id of the page's site collection */
  siteId: string
  /** The id of the hub the page's site belongs to (`legacyPageContext.hubSiteId`) */
  hubSiteId?: string
  /** Whether the page is on the hub site itself */
  isHubPage: boolean
  /** The bundle's version (`manifest.version`) */
  appVersion: string
  /** The bundle's `DEBUG` constant: a DEBUG build logs its batches and never sends them */
  isDebug: boolean
  /** Whether the user may manage the hub web. Only the Footer knows, and only it passes it. */
  canManageHub?: boolean
}

/** The parts of an SPFx component's context that describe the page. */
export interface ITelemetrySpfxContext {
  pageContext: {
    web: { absoluteUrl: string }
    site: { id: { toString(): string } }
    legacyPageContext: Record<string, any>
  }
  manifest: { version: string }
}

/**
 * Runs a tracking call so that it never throws: telemetry must not break the code that reports to
 * it, and the call is a no-op without a window or before `startTelemetry`.
 *
 * An old decision is renewed before the call looks at the level, so also by a call the old level
 * drops: a tab that stays open on a hub at level 0 or 1 would otherwise never see the level raised.
 */
function withStore(action: (store: ITelemetryStore) => void): void {
  try {
    const store = getTelemetryStore()
    if (!store || !store.page) return
    refreshTelemetryGate()
    action(store)
  } catch {
    // Dropped.
  }
}

/** After something was counted: start the lookups a flush will need. */
function afterTracking(store: ITelemetryStore): void {
  ensureTelemetrySiteInfo(store, Date.now())
}

/** The host of a URL, or an empty text for a value that is no URL: without a host nothing is sent. */
function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return ''
  }
}

/**
 * Builds what `startTelemetry` needs from an SPFx component's context. It never throws: the caller
 * evaluates it before `startTelemetry` can catch anything, so a context that cannot be read (no
 * `legacyPageContext`, a site id that is no text) gives a page that nothing is sent from.
 *
 * @param context The web part's or extension's context
 * @param options The bundle's `DEBUG` constant and, from the Footer, whether the user manages
 * the hub
 */
export function telemetryInitFromContext(
  context: ITelemetrySpfxContext,
  options: Pick<ITelemetryInit, 'isDebug' | 'canManageHub'>
): ITelemetryInit {
  try {
    const { pageContext, manifest } = context
    const { legacyPageContext } = pageContext
    return {
      host: hostOf(pageContext.web.absoluteUrl),
      tenantId: legacyPageContext.aadTenantId,
      siteId: pageContext.site.id.toString(),
      hubSiteId: legacyPageContext.hubSiteId,
      // `isHubSite` answers yes for an empty hub id, which a site outside every hub has.
      isHubPage:
        !!legacyPageContext.hubSiteId &&
        !!legacyPageContext.siteId &&
        isHubSite(pageContext as unknown as Parameters<typeof isHubSite>[0]),
      appVersion: manifest.version,
      ...options
    }
  } catch {
    return { host: '', siteId: '', isHubPage: false, appVersion: '', ...options }
  }
}

/**
 * Starts telemetry for a bundle, early in its `onInit`. The first call on a page creates the
 * window's store and installs the flush listeners; every bundle calls it, and they share the store.
 *
 * A later call with another site or hub id is how an SPA navigation is seen. When the new page
 * belongs to another hub, what was counted is sent under the old hub's decision, and the anchor
 * and the decision are dropped: the new hub's setting has not been read.
 *
 * @param init The page and the bundle, as plain values
 */
export function startTelemetry(init: ITelemetryInit): void {
  try {
    const store = getTelemetryStore(true)
    if (!store || !init) return
    const previous = store.page
    const hubSiteId = normalizeGuid(init.hubSiteId)
    const isSameHub = !!previous && previous.hubSiteId === hubSiteId
    const page: ITelemetryPage = {
      host: normalizeHost(init.host),
      tenantId: normalizeGuid(init.tenantId),
      siteId: normalizeGuid(init.siteId),
      hubSiteId,
      isHubPage: init.isHubPage === true,
      appVersion: normalizeVersion(init.appVersion) || previous?.appVersion || '',
      isDebug: init.isDebug === true || previous?.isDebug === true,
      canManageHub: init.canManageHub ?? (isSameHub && previous.canManageHub)
    }
    if (previous && !isSameHub) {
      flushTelemetry({ urgent: true })
      resetTelemetryHub(store)
    }
    store.page = page
    if (page.siteId && page.hubSiteId && page.isHubPage) store.siteTypes[page.siteId] = 'hub'
    installTelemetryListeners()
    refreshTelemetryGate()
    afterTracking(store)
  } catch {
    // Telemetry never breaks the bundle that starts it.
  }
}

/**
 * Counts a usage event (level 2 and up) for a component on the page's site. The contract decides
 * which events a component may count and which variants an event has: a pairing it does not have
 * fails to compile, and is dropped at runtime where the types were cast away.
 *
 * @param component The component's alias (`manifest.alias`), one the contract lists for the event
 * @param event The event
 * @param variant The event's variant, for an event that has variants
 */
export function trackUsage<E extends TelemetryEvent>(
  component: TelemetryEventComponent<E>,
  event: E,
  variant?: TelemetryVariant<E>
): void {
  withStore((store) => {
    const { siteId } = store.page
    if (isTelemetryLevelClosed(store, 2) || !siteId) return
    if (!isTelemetryUsage(component, event, variant)) return
    const key = [siteId, component, event, variant].join('|')
    const counter = store.usage[key] ?? { siteId, c: component, e: event, n: 0 }
    if (variant != null) counter.v = variant
    counter.n = Math.min(MAX_ENTRY_COUNT, counter.n + 1)
    store.usage[key] = counter
    afterTracking(store)
  })
}

/**
 * A short, one-way stand-in for a text (FNV-1a, 32 bits): enough to tell one page's path from the
 * next one's, without the path being kept.
 */
function hashOf(text: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index++) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193)
  }
  return (hash >>> 0).toString(16)
}

/**
 * The key of the page a view is counted for: the site's id and a hash of the path of the page's
 * address, in lowercase and without a trailing slash. The query and the fragment are left out, so
 * a view that is switched or a folder that is opened in a list is still the same page.
 */
function pageViewKey(siteId: string): string {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '')
  return `${siteId}|${hashOf(path)}`
}

/**
 * Counts a page view (`page.viewed`, level 2 and up) for the Footer, once per page. A site can
 * carry the footers of two channels, and both bundles report the same page to the window's one
 * store: the second call for a page counts nothing. An SPA navigation to another page counts
 * again, also back to a page seen before. Call it after `startTelemetry` has been given the page.
 *
 * The store remembers the page counted last by its key (`pageViewKey`): the site's id and a hash
 * of the page's path, never the path itself. The key stays in memory and is in no batch.
 *
 * @param component The Footer's alias (`manifest.alias`)
 */
export function trackPageView(component: TelemetryEventComponent<'page.viewed'>): void {
  withStore((store) => {
    const { siteId } = store.page
    if (!siteId || !isTelemetryUsage(component, 'page.viewed')) return
    const key = pageViewKey(siteId)
    if (store.lastPageViewKey === key) return
    store.lastPageViewKey = key
    trackUsage(component, 'page.viewed')
  })
}

/**
 * Counts an error (level 3) for a component. Only a code from the contract is counted: one the
 * caller passes (`render_failed`, `provisioning_failed`), or the code and HTTP status
 * `errorCodeFrom` reads off the error. The error's message is never read.
 *
 * @param component The component's alias (`manifest.alias`)
 * @param errorOrCode The caught error, or an error code of the contract
 */
export function trackError(component: TelemetryComponent, errorOrCode: unknown): void {
  withStore((store) => {
    if (isTelemetryLevelClosed(store, 3) || !isTelemetryComponent(component)) return
    const code = isTelemetryErrorCode(errorOrCode) ? errorOrCode : errorCodeFrom(errorOrCode)
    const http = isTelemetryErrorCode(errorOrCode) ? undefined : errorHttpStatusFrom(errorOrCode)
    const key = [component, code, http].join('|')
    const counter = store.errors[key] ?? { c: component, code, http, n: 0 }
    counter.n = Math.min(MAX_ENTRY_COUNT, counter.n + 1)
    store.errors[key] = counter
    afterTracking(store)
  })
}

/**
 * Counts a duration (level 3) for a component in one of the seven buckets. The duration itself is
 * not kept.
 *
 * @param component The component's alias (`manifest.alias`)
 * @param metric What was timed
 * @param milliseconds How long it took
 */
export function trackTiming(
  component: TelemetryComponent,
  metric: TelemetryTimingMetric,
  milliseconds: number
): void {
  withStore((store) => {
    const bucket = timingBucketOf(milliseconds)
    if (isTelemetryLevelClosed(store, 3) || bucket === -1) return
    if (!isTelemetryComponent(component) || !isTelemetryTimingMetric(metric)) return
    const key = [component, metric].join('|')
    const counter = store.timings[key] ?? {
      c: component,
      m: metric,
      h: TELEMETRY_TIMING_BUCKETS.map(() => 0)
    }
    counter.h[bucket] = Math.min(MAX_ENTRY_COUNT, counter.h[bucket] + 1)
    store.timings[key] = counter
    afterTracking(store)
  })
}

/**
 * Queues the hub's heartbeat (level 1 and up) for the next flush. It is taken only on a hub page
 * from a user who may manage the hub, and once per page load; values outside the contract are
 * replaced or left out. The gate's catalog flag is added when it is sent.
 *
 * @param heartbeat The hub's installation facts
 */
export function queueHeartbeat(heartbeat: TelemetryHeartbeatInput): void {
  withStore((store) => {
    const { isHubPage, canManageHub } = store.page
    if (isTelemetryLevelClosed(store, 1) || !isHubPage || !canManageHub) return
    if (store.heartbeatQueued || !heartbeat) return
    store.heartbeatQueued = true
    store.heartbeat = sanitizeHeartbeat(heartbeat)
    afterTracking(store)
  })
}

/**
 * Asks for the hub's heartbeat (level 1 and up), from the Footer: the hub's installation facts
 * are read through the anchor (`PortalDataService.getUsageSnapshot`), joined with the hub's
 * language and sent at once. Nothing is read before the gate has resolved at level 1 or higher:
 * the call is safe while the gate is pending, and a hub at level 0 pays for no read. Like
 * `queueHeartbeat` it takes a heartbeat only on a hub page from a user who may manage the hub,
 * and once per page load.
 *
 * @param hubLanguage The hub web's language (`hubLanguageFromLcid`)
 */
export function requestHeartbeat(hubLanguage: TelemetryHubLanguage): void {
  withStore((store) => {
    const { isHubPage, canManageHub } = store.page
    if (isTelemetryLevelClosed(store, 1) || !isHubPage || !canManageHub) return
    if (store.heartbeatQueued || !hubLanguage) return
    store.heartbeatRequest = hubLanguage
    ensureTelemetryHeartbeat(store, Date.now(), flushTelemetryNow)
  })
}

/**
 * Registers how to find out what kind of site a site is: a project, a program, a parent project
 * or something else. A hub page needs none. The resolver is called lazily, once per site, and only
 * after the gate has resolved at level 2 or 3, so a hub at a lower level pays for no read. Usage
 * counted on a site whose type is not known yet waits in memory.
 *
 * @param siteId The site's id
 * @param resolver Reads the site's type
 */
export function registerSiteTypeResolver(
  siteId: string,
  resolver: () => Promise<TelemetryResolvedSiteType>
): void {
  withStore((store) => {
    const id = normalizeGuid(siteId)
    if (!id || typeof resolver !== 'function') return
    if (store.siteTypes[id] || store.siteTypeRequested[id] || store.siteTypeResolvers[id]) return
    store.siteTypeResolvers[id] = resolver
    afterTracking(store)
  })
}

/**
 * Tells telemetry what kind of site a site is, from code that knows: the project setup, from the
 * template it has set the site up with (`siteTypeFromTemplate`). It replaces what a resolver
 * answered, which may have read the site before the setup changed it, and no resolver is asked
 * for the site afterwards. The type is known at once, so usage counted on the site can go in the
 * next flush. A hub page stays a hub.
 *
 * @param siteId The site's id
 * @param siteType The site's type
 */
export function setSiteType(siteId: string, siteType: TelemetryResolvedSiteType): void {
  withStore((store) => {
    const id = normalizeGuid(siteId)
    // The types rule `hub` out; a caller that cast them away is held to it here.
    const type = siteType as TelemetrySiteType
    if (!id || !isTelemetrySiteType(type) || type === 'hub') return
    if (store.siteTypes[id] === 'hub') return
    store.siteTypes[id] = type
    delete store.siteTypeResolvers[id]
    afterTracking(store)
  })
}
