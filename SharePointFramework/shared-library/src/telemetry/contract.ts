/**
 * The usage statistics contract between Prosjektportalen 365 and Assist, schema 1: every value a
 * batch may hold. Data only, with no imports, so Assist keeps a verbatim copy of this file. A new
 * field, event or value changes this file, Assist's copy and the golden fixture
 * (`__fixtures__/usage-batch-v1.json`) in the same change.
 */

/** The contract's schema version. A new version also gets a new window global (`store.ts`). */
export const TELEMETRY_SCHEMA = 1

/** The one endpoint usage batches are posted to. There is no override. */
export const USAGE_TELEMETRY_URL = 'https://assist.prosjektportalen.no/api/telemetry/usage'

/** A request's body is split so that it stays at or under this many bytes. */
export const MAX_BATCH_BYTES = 15000

/** The least time between two sends that are not urgent. */
export const MIN_SEND_INTERVAL_MS = 60000

/** The most requests one window sends, as a guard against a runaway loop. */
export const MAX_SENDS_PER_WINDOW = 500

/** How long a gate decision is used before the settings are read again. */
export const GATE_MAX_AGE_MS = 3600000

/** The most `usage` entries in one batch. */
export const MAX_USAGE_ENTRIES = 200

/** The most `errors` entries in one batch. */
export const MAX_ERROR_ENTRIES = 100

/** The most `timings` entries in one batch. */
export const MAX_TIMING_ENTRIES = 100

/** The most `sites` entries in one batch. */
export const MAX_SITE_ENTRIES = 50

/** The highest count (`n`, and each timing bucket) an entry carries. */
export const MAX_ENTRY_COUNT = 10000

/** The highest number of projects, programs or parent projects a heartbeat carries. */
export const MAX_HEARTBEAT_COUNT = 100000

/** The levels of the setting `UsageStatisticsLevel`: off, basic, standard and extended. */
export const TELEMETRY_LEVELS = [0, 1, 2, 3] as const

/** The aliases of the web parts, as in `channels/main.json`. */
export const TELEMETRY_WEB_PARTS = [
  'LatestProjectsWebPart',
  'PortfolioAggregationWebPart',
  'PortfolioOverviewWebPart',
  'ProjectListWebPart',
  'PortfolioTimelineWebPart',
  'ResourceAllocationWebPart',
  'IdeaModuleWebPart',
  'ProjectCardWebPart',
  'ProgramAdministrationWebpart',
  'ProgramAggregationWebPart',
  'ProgramProjectOverviewWebPart',
  'ProgramTimelineWebPart',
  'OpportunityMatrixWebPart',
  'ProjectInformationWebPart',
  'ProjectPhasesWebPart',
  'ProjectStatusWebPart',
  'ProjectTimelineWebPart',
  'RiskMatrixWebPart',
  'ProjectNewsWebPart',
  'DynamicListWebPart'
] as const

/** The aliases of the extensions, as in `channels/main.json`, without `ProjectUpgrade`. */
export const TELEMETRY_EXTENSIONS = [
  'Footer',
  'IdeaProcessing',
  'IdeaProjectData',
  'IdeaRegistration',
  'TemplatePackageCatalog',
  'ProjectSetup',
  'RiskActionPlanner',
  'TemplateSelectorCommand'
] as const

/** Every component (`c`) an entry may name. */
export const TELEMETRY_COMPONENTS = [...TELEMETRY_WEB_PARTS, ...TELEMETRY_EXTENSIONS] as const

/** The kinds of site (`s`) usage is counted on. */
export const TELEMETRY_SITE_TYPES = ['hub', 'project', 'program', 'parent', 'other'] as const

/**
 * The usage events (`e`), each with the components that may count it, its variants (`v`) and the
 * first release that emits it (`since`; `null` while an event is only reserved).
 */
export const TELEMETRY_EVENTS = {
  loaded: { components: TELEMETRY_WEB_PARTS, variants: [], since: '1.15.0' },
  'page.viewed': { components: ['Footer'], variants: [], since: '1.15.0' },
  'setup.completed': {
    components: ['ProjectSetup'],
    variants: ['new', 'rerun', 'parent'],
    since: '1.15.0'
  },
  'setup.aborted': { components: ['ProjectSetup'], variants: [], since: '1.15.0' },
  'setup.failed': { components: ['ProjectSetup'], variants: [], since: '1.15.0' },
  'statusReport.created': { components: ['ProjectStatusWebPart'], variants: [], since: '1.15.0' },
  'statusReport.published': { components: ['ProjectStatusWebPart'], variants: [], since: '1.15.0' },
  'statusReport.edited': { components: ['ProjectStatusWebPart'], variants: [], since: '1.15.0' },
  'statusReport.deleted': { components: ['ProjectStatusWebPart'], variants: [], since: '1.15.0' },
  'phase.changed': { components: ['ProjectPhasesWebPart'], variants: [], since: '1.15.0' },
  'properties.edited': { components: ['ProjectInformationWebPart'], variants: [], since: '1.15.0' },
  'excel.exported': {
    components: [
      'PortfolioOverviewWebPart',
      'PortfolioAggregationWebPart',
      'ProgramProjectOverviewWebPart',
      'ProgramAggregationWebPart',
      'DynamicListWebPart'
    ],
    variants: [],
    since: '1.15.0'
  },
  'timelineItem.opened': {
    components: ['PortfolioTimelineWebPart', 'ProjectTimelineWebPart', 'ProgramTimelineWebPart'],
    variants: [],
    since: '1.15.0'
  },
  'catalog.opened': { components: ['TemplatePackageCatalog'], variants: [], since: '1.15.0' },
  'assistant.opened': { components: ['Footer'], variants: [], since: '1.15.0' },
  'help.opened': { components: ['Footer'], variants: [], since: '1.15.0' },
  'news.created': { components: ['ProjectNewsWebPart'], variants: [], since: '1.15.0' },
  'postAction.toggled': {
    components: ['RiskMatrixWebPart', 'OpportunityMatrixWebPart'],
    variants: [],
    since: '1.15.0'
  },
  'view.switched': {
    components: ['PortfolioOverviewWebPart', 'ProgramProjectOverviewWebPart'],
    variants: [],
    since: '1.15.0'
  },
  'view.saved': {
    components: ['PortfolioOverviewWebPart', 'ProgramProjectOverviewWebPart'],
    variants: [],
    since: '1.15.0'
  },
  'portfolio.switched': { components: ['PortfolioOverviewWebPart'], variants: [], since: '1.15.0' },
  'dataSource.switched': {
    components: ['PortfolioAggregationWebPart', 'ProgramAggregationWebPart'],
    variants: [],
    since: '1.15.0'
  },
  'layout.toggled': {
    components: ['PortfolioAggregationWebPart', 'ProgramAggregationWebPart'],
    variants: [],
    since: '1.15.0'
  },
  'viewAll.toggled': { components: ['LatestProjectsWebPart'], variants: [], since: '1.15.0' },
  'tab.switched': { components: ['ProjectListWebPart'], variants: [], since: '1.15.0' },
  'documentTemplates.copied': {
    components: ['TemplateSelectorCommand'],
    variants: [],
    since: '1.15.0'
  },
  'riskAction.created': { components: ['RiskActionPlanner'], variants: [], since: '1.15.0' },
  'idea.recommended': {
    components: ['IdeaRegistration'],
    variants: ['approve', 'consider', 'reject', 'other'],
    since: '1.15.0'
  },
  'idea.decided': {
    components: ['IdeaProcessing'],
    variants: ['approve', 'consider', 'reject', 'other'],
    since: '1.15.0'
  },
  'idea.projectDataCreated': { components: ['IdeaProjectData'], variants: [], since: '1.15.0' },
  'childProjects.added': {
    components: ['ProgramAdministrationWebpart'],
    variants: [],
    since: '1.15.0'
  },
  'childProjects.removed': {
    components: ['ProgramAdministrationWebpart'],
    variants: [],
    since: '1.15.0'
  }
} as const

/** The error codes (`code`) of level 3. They come from an HTTP status or our own error types. */
export const TELEMETRY_ERROR_CODES = [
  'permission_denied',
  'not_found',
  'throttled',
  'server_error',
  'timeout',
  'network',
  'render_failed',
  'provisioning_failed',
  'unknown'
] as const

/** The HTTP statuses (`http`) an error entry may carry. Any other status is left out. */
export const TELEMETRY_HTTP_STATUSES = [
  0, 400, 401, 403, 404, 409, 412, 429, 500, 502, 503, 504
] as const

/** The timing metrics (`m`) emitted today. */
export const TELEMETRY_TIMING_METRICS = ['init'] as const

/** Timing metrics Assist accepts and no release emits yet. */
export const TELEMETRY_RESERVED_TIMING_METRICS = ['firstRender', 'dataLoad'] as const

/**
 * The lower bound in milliseconds of each of the seven timing buckets (`h`): 0-249, 250-499,
 * 500-999, 1000-1999, 2000-3999, 4000-7999 and 8000 or more. No raw duration is sent.
 */
export const TELEMETRY_TIMING_BUCKETS = [0, 250, 500, 1000, 2000, 4000, 8000] as const

/** The release channels a heartbeat may name. */
export const TELEMETRY_CHANNELS = ['main', 'test', 'i18n', 'kurs', 'unknown'] as const

/** The hub languages a heartbeat may name: the hub web's, never a user's. */
export const TELEMETRY_HUB_LANGUAGES = ['nb-NO', 'en-US', 'other'] as const

/** The field names of a batch and of each kind of entry, in the order they are written. */
export const TELEMETRY_FIELDS = {
  envelope: [
    'schema',
    'batchId',
    'host',
    'tenantId',
    'hubUrl',
    'level',
    'appVersion',
    'heartbeat',
    'usage',
    'sites',
    'errors',
    'timings'
  ],
  heartbeat: [
    'channel',
    'templateVersion',
    'hubLanguage',
    'projects',
    'programs',
    'parentProjects',
    'catalog'
  ],
  usage: ['c', 'e', 's', 'v', 'n'],
  sites: ['h', 's'],
  errors: ['c', 'code', 'http', 'n'],
  timings: ['c', 'm', 'h']
} as const

/** The patterns of the envelope's texts. */
export const TELEMETRY_PATTERNS = {
  /** `host`: a SharePoint Online host, at most 128 characters. */
  host: /^[a-z0-9-]+\.sharepoint\.com$/,
  /** `tenantId` and `batchId`: a lowercase GUID. */
  guid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  /** The path of `hubUrl`, after `https://<host>`: empty, or one segment under sites or teams. */
  hubPath: /^(\/(sites|teams)\/[^/?#\s]+)?$/,
  /** `appVersion` and `templateVersion`: a three-part version. */
  version: /^\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /** `h` of a `sites` entry: the first 16 hex characters of the site hash. */
  siteHash: /^[0-9a-f]{16}$/
} as const

/** The most characters of `host`. */
export const MAX_HOST_LENGTH = 128

/** The most characters of `hubUrl`. */
export const MAX_HUB_URL_LENGTH = 512

export type TelemetryLevel = (typeof TELEMETRY_LEVELS)[number]
export type TelemetryComponent = (typeof TELEMETRY_COMPONENTS)[number]
export type TelemetrySiteType = (typeof TELEMETRY_SITE_TYPES)[number]
export type TelemetryEvent = keyof typeof TELEMETRY_EVENTS
/** The components that may count one event. */
export type TelemetryEventComponent<E extends TelemetryEvent = TelemetryEvent> =
  (typeof TELEMETRY_EVENTS)[E]['components'][number]
/** The variants of one event; `never` for an event without variants. */
export type TelemetryVariant<E extends TelemetryEvent = TelemetryEvent> =
  (typeof TELEMETRY_EVENTS)[E]['variants'][number]
export type TelemetryErrorCode = (typeof TELEMETRY_ERROR_CODES)[number]
export type TelemetryHttpStatus = (typeof TELEMETRY_HTTP_STATUSES)[number]
export type TelemetryTimingMetric = (typeof TELEMETRY_TIMING_METRICS)[number]
export type TelemetryChannel = (typeof TELEMETRY_CHANNELS)[number]
export type TelemetryHubLanguage = (typeof TELEMETRY_HUB_LANGUAGES)[number]

/** Level 1: the hub's installation facts, sent from a hub page by a user who manages the hub. */
export interface ITelemetryHeartbeat {
  channel: TelemetryChannel
  templateVersion?: string
  hubLanguage: TelemetryHubLanguage
  projects?: number
  programs?: number
  parentProjects?: number
  /** Whether the gate allows catalog events. */
  catalog: boolean
}

/** Level 2: how many times a component counted an event on a kind of site. */
export interface ITelemetryUsageEntry {
  c: TelemetryComponent
  e: TelemetryEvent
  s: TelemetrySiteType
  v?: TelemetryVariant
  n: number
}

/** Level 2: a site in use, as its monthly hash and its kind. */
export interface ITelemetrySiteEntry {
  h: string
  s: TelemetrySiteType
}

/** Level 3: how many times a component met an error code. */
export interface ITelemetryErrorEntry {
  c: TelemetryComponent
  code: TelemetryErrorCode
  http?: TelemetryHttpStatus
  n: number
}

/** Level 3: a component's durations for a metric, counted in the seven buckets. */
export interface ITelemetryTimingEntry {
  c: TelemetryComponent
  m: TelemetryTimingMetric
  h: number[]
}

/** One batch as it is posted. It carries at least one of heartbeat, usage, errors and timings. */
export interface ITelemetryBatch {
  schema: typeof TELEMETRY_SCHEMA
  batchId: string
  host: string
  tenantId?: string
  hubUrl: string
  level: Exclude<TelemetryLevel, 0>
  appVersion: string
  heartbeat?: ITelemetryHeartbeat
  usage?: ITelemetryUsageEntry[]
  sites?: ITelemetrySiteEntry[]
  errors?: ITelemetryErrorEntry[]
  timings?: ITelemetryTimingEntry[]
}
