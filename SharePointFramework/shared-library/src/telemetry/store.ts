import {
  GATE_MAX_AGE_MS,
  TelemetryComponent,
  TelemetryErrorCode,
  TelemetryEvent,
  TelemetryHttpStatus,
  TelemetryLevel,
  TelemetrySiteType,
  TelemetryTimingMetric,
  TelemetryVariant
} from './contract'
import { ITelemetryGate } from './gate'
import { TelemetryHeartbeatInput, TelemetryUsageSnapshot } from './validate'

/**
 * The name of the store on `window`. The shared library is copied into every bundle, so a module
 * variable exists once per bundle: all telemetry state lives here, where every copy finds the same
 * object. A new schema version, or a change to the store's shape, gets a new name.
 */
export const TELEMETRY_STORE_KEY = '__pp365UsageV1'

/**
 * The hub's data service as telemetry needs it: `PortalDataService` fits. Telemetry reads the
 * settings only through `getGlobalSettings`, which the app itself caches, and the hub's
 * installation facts for a heartbeat only through `getUsageSnapshot`.
 */
export interface ITelemetryPortal {
  isAvailable: boolean
  hubSiteId?: string
  url?: string
  getGlobalSettings(): Promise<Map<string, string>>
  /** The hub's installation facts, or `null` when the hub is out of reach. Read for a heartbeat. */
  getUsageSnapshot?(): Promise<TelemetryUsageSnapshot | null>
}

/** The page telemetry runs on, normalised: a value that is not valid is an empty text. */
export interface ITelemetryPage {
  host: string
  tenantId: string
  siteId: string
  hubSiteId: string
  isHubPage: boolean
  appVersion: string
  /** True once any bundle on the page is a DEBUG build: batches are then logged, never sent. */
  isDebug: boolean
  canManageHub: boolean
}

/** The portal of the page's own hub: the only portal telemetry reads through. */
export interface ITelemetryAnchor {
  portal: ITelemetryPortal
  hubSiteId: string
}

/** The gate's answer, with the time it was given and the hub it is for. */
export interface ITelemetryDecision extends ITelemetryGate {
  at: number
  hubSiteId: string
}

/** A usage count on one site. The site id stays in the browser: a batch carries the site type. */
export interface ITelemetryUsageCounter {
  siteId: string
  c: TelemetryComponent
  e: TelemetryEvent
  v?: TelemetryVariant
  n: number
}

/** A count of one error code. */
export interface ITelemetryErrorCounter {
  c: TelemetryComponent
  code: TelemetryErrorCode
  http?: TelemetryHttpStatus
  n: number
}

/** A component's durations for a metric, counted in the seven buckets. */
export interface ITelemetryTimingCounter {
  c: TelemetryComponent
  m: TelemetryTimingMetric
  h: number[]
}

/** A site's hash with the Oslo month (`YYYY-MM`) it was computed for. */
export interface ITelemetrySiteHash {
  month: string
  hash: string
}

/** Everything telemetry keeps: in memory only, never serialised and never written to storage. */
export interface ITelemetryStore {
  page?: ITelemetryPage
  /** Usage counters by site id, component, event and variant. */
  usage: Record<string, ITelemetryUsageCounter>
  /** Error counters by component, code and HTTP status. */
  errors: Record<string, ITelemetryErrorCounter>
  /** Timing counters by component and metric. */
  timings: Record<string, ITelemetryTimingCounter>
  heartbeat?: TelemetryHeartbeatInput
  /** A hub's heartbeat goes at most once per page load. */
  heartbeatQueued: boolean
  /**
   * The hub's language of a heartbeat the Footer has asked for (`requestHeartbeat`), while it
   * waits for the gate: the hub's installation facts are read only once the level allows them.
   */
  heartbeatRequest?: TelemetryHeartbeatInput['hubLanguage']
  /**
   * The page whose view was counted last (`trackPageView`): the site's id and a hash of the
   * page's path, never the path itself. It keeps two Footer bundles on one page from counting the
   * same view twice. Like the site ids it stays in memory, and it is never part of a batch.
   */
  lastPageViewKey?: string
  anchor?: ITelemetryAnchor
  decision?: ITelemetryDecision
  /** A lower answer from a settings map that came before the anchor's own answer. */
  gateCap?: ITelemetryGate
  /** The anchor whose settings are being read. */
  gateReadFor?: ITelemetryAnchor
  siteTypes: Record<string, TelemetrySiteType>
  siteTypeResolvers: Record<string, () => Promise<TelemetrySiteType>>
  /** The sites whose resolver has been called: each is asked once. */
  siteTypeRequested: Record<string, boolean>
  siteHashes: Record<string, ITelemetrySiteHash>
  siteHashRequested: Record<string, boolean>
  lastSendAt: number
  sendCount: number
  listenersInstalled: boolean
}

/** An empty store. */
export function createTelemetryStore(): ITelemetryStore {
  return {
    usage: {},
    errors: {},
    timings: {},
    heartbeatQueued: false,
    siteTypes: {},
    siteTypeResolvers: {},
    siteTypeRequested: {},
    siteHashes: {},
    siteHashRequested: {},
    lastSendAt: 0,
    sendCount: 0,
    listenersInstalled: false
  }
}

/**
 * The window's telemetry store, or `undefined` where there is no window (Node, where the
 * integration tests run the library) or no store yet.
 *
 * @param create Whether to create the store when the window has none
 */
export function getTelemetryStore(create: boolean = false): ITelemetryStore | undefined {
  if (typeof window === 'undefined') return undefined
  const host = window as unknown as Record<string, ITelemetryStore | undefined>
  if (!host[TELEMETRY_STORE_KEY] && create) host[TELEMETRY_STORE_KEY] = createTelemetryStore()
  return host[TELEMETRY_STORE_KEY]
}

/**
 * The decision a sender may act on now: made for the page's hub through the current anchor, and
 * not older than `GATE_MAX_AGE_MS`. Otherwise `undefined`, and nothing is sent.
 */
export function currentTelemetryDecision(
  store: ITelemetryStore,
  now: number
): ITelemetryDecision | undefined {
  const { decision, anchor, page } = store
  if (!decision || !anchor || !page) return undefined
  if (decision.hubSiteId !== page.hubSiteId || decision.hubSiteId !== anchor.hubSiteId) {
    return undefined
  }
  const age = now - decision.at
  return age >= 0 && age <= GATE_MAX_AGE_MS ? decision : undefined
}

/** Whether a decision says that data of the given level must not be collected. */
export function isTelemetryLevelClosed(store: ITelemetryStore, level: TelemetryLevel): boolean {
  return !!store.decision && store.decision.level < level
}

/**
 * Drops what was collected above a level: the heartbeat, and one that was asked for, below 1,
 * usage below 2, errors and timings below 3.
 */
export function pruneTelemetryStore(store: ITelemetryStore, level: TelemetryLevel): void {
  if (level < 1) {
    store.heartbeat = undefined
    store.heartbeatRequest = undefined
  }
  if (level < 2) store.usage = {}
  if (level < 3) {
    store.errors = {}
    store.timings = {}
  }
}

/**
 * Forgets the hub: its anchor, its decision and everything collected under it. Used when the page
 * turns out to belong to another hub, whose setting has not been read.
 */
export function resetTelemetryHub(store: ITelemetryStore): void {
  pruneTelemetryStore(store, 0)
  store.heartbeatQueued = false
  store.anchor = undefined
  store.decision = undefined
  store.gateCap = undefined
  store.gateReadFor = undefined
}
