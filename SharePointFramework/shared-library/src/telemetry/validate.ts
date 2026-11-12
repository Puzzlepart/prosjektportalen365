import {
  ITelemetryHeartbeat,
  MAX_HEARTBEAT_COUNT,
  MAX_HOST_LENGTH,
  MAX_HUB_URL_LENGTH,
  TELEMETRY_CHANNELS,
  TELEMETRY_COMPONENTS,
  TELEMETRY_ERROR_CODES,
  TELEMETRY_EVENTS,
  TELEMETRY_HTTP_STATUSES,
  TELEMETRY_HUB_LANGUAGES,
  TELEMETRY_PATTERNS,
  TELEMETRY_SITE_TYPES,
  TELEMETRY_TIMING_BUCKETS,
  TELEMETRY_TIMING_METRICS,
  TelemetryComponent,
  TelemetryErrorCode,
  TelemetryHttpStatus,
  TelemetrySiteType,
  TelemetryTimingMetric
} from './contract'

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

/** A heartbeat as a caller queues it: the gate's catalog flag is added when it is sent. */
export type TelemetryHeartbeatInput = Omit<ITelemetryHeartbeat, 'catalog'>

/** An event's row in the contract, read without its literal types. */
interface ITelemetryEventDefinition {
  components: readonly string[]
  variants: readonly string[]
}

/** Whether one of the contract's lists holds the value. */
function isOneOf(list: readonly unknown[], value: unknown): boolean {
  return list.indexOf(value) !== -1
}

/** Whether the value is a component alias of the contract. */
export function isTelemetryComponent(value: unknown): value is TelemetryComponent {
  return isOneOf(TELEMETRY_COMPONENTS, value)
}

/** Whether the value is a site type of the contract. */
export function isTelemetrySiteType(value: unknown): value is TelemetrySiteType {
  return isOneOf(TELEMETRY_SITE_TYPES, value)
}

/** Whether the value is an error code of the contract. */
export function isTelemetryErrorCode(value: unknown): value is TelemetryErrorCode {
  return isOneOf(TELEMETRY_ERROR_CODES, value)
}

/** Whether the value is a timing metric a release emits. */
export function isTelemetryTimingMetric(value: unknown): value is TelemetryTimingMetric {
  return isOneOf(TELEMETRY_TIMING_METRICS, value)
}

/**
 * Whether the contract lets the component count the event, with that variant or without one. An
 * event without variants takes none, and an event with variants takes only its own.
 */
export function isTelemetryUsage(component: unknown, event: unknown, variant?: unknown): boolean {
  if (typeof event !== 'string' || !Object.prototype.hasOwnProperty.call(TELEMETRY_EVENTS, event)) {
    return false
  }
  const definition = (TELEMETRY_EVENTS as Record<string, ITelemetryEventDefinition>)[event]
  if (!isOneOf(definition.components, component)) return false
  return variant == null || isOneOf(definition.variants, variant)
}

/** The status as the contract allows it in an error entry, or `undefined` for any other status. */
export function telemetryHttpStatus(status: unknown): TelemetryHttpStatus | undefined {
  return isOneOf(TELEMETRY_HTTP_STATUSES, status) ? (status as TelemetryHttpStatus) : undefined
}

/**
 * The index of the timing bucket a duration falls in, or -1 for a value that is no duration.
 *
 * @param milliseconds The duration
 */
export function timingBucketOf(milliseconds: unknown): number {
  if (typeof milliseconds !== 'number' || !isFinite(milliseconds) || milliseconds < 0) return -1
  let bucket = 0
  TELEMETRY_TIMING_BUCKETS.forEach((lowerBound, index) => {
    if (milliseconds >= lowerBound) bucket = index
  })
  return bucket
}

/**
 * A GUID without braces and in lowercase, or an empty text when the value is not a GUID. The empty
 * GUID counts as none: SharePoint gives it to a site outside every hub.
 */
export function normalizeGuid(value: unknown): string {
  if (typeof value !== 'string') return ''
  const guid = value.replace(/[{}]/g, '').trim().toLowerCase()
  return TELEMETRY_PATTERNS.guid.test(guid) && guid !== EMPTY_GUID ? guid : ''
}

/** The host in lowercase when it is a SharePoint Online host, otherwise an empty text. */
export function normalizeHost(value: unknown): string {
  if (typeof value !== 'string') return ''
  const host = value.trim().toLowerCase()
  return host.length <= MAX_HOST_LENGTH && TELEMETRY_PATTERNS.host.test(host) ? host : ''
}

/**
 * The hub URL as it is sent: lowercase, without a trailing slash, https on the page's own host, and
 * with no path or one segment under sites or teams. Anything else gives an empty text, so a URL
 * with a query, a fragment, a page or another host never leaves the tenant.
 *
 * @param url The anchor portal's URL
 * @param host The page's host, normalised
 */
export function normalizeHubUrl(url: unknown, host: string): string {
  if (typeof url !== 'string' || !host) return ''
  const hubUrl = url.trim().toLowerCase().replace(/\/+$/, '')
  const origin = `https://${host}`
  if (hubUrl.length > MAX_HUB_URL_LENGTH || hubUrl.indexOf(origin) !== 0) return ''
  return TELEMETRY_PATTERNS.hubPath.test(hubUrl.substring(origin.length)) ? hubUrl : ''
}

/**
 * The three-part version of a longer one (`1.15.0.a1b2c3d` gives `1.15.0`), or an empty text.
 *
 * @param value A manifest's or an installation's version
 */
export function normalizeVersion(value: unknown): string {
  if (typeof value !== 'string') return ''
  const version = value.trim().split(/[.+-]/).slice(0, 3).join('.')
  return TELEMETRY_PATTERNS.version.test(version) ? version : ''
}

/** A count from 0 to the heartbeat's highest, or `undefined` for anything else. */
function heartbeatCount(value: unknown): number | undefined {
  if (typeof value !== 'number' || value % 1 !== 0) return undefined
  return value >= 0 && value <= MAX_HEARTBEAT_COUNT ? value : undefined
}

/**
 * The heartbeat with only the contract's fields and values: an unknown channel becomes `unknown`,
 * an unknown language `other`, and a version or a count that is not one is left out.
 *
 * @param heartbeat The heartbeat as the caller built it
 */
export function sanitizeHeartbeat(heartbeat: TelemetryHeartbeatInput): TelemetryHeartbeatInput {
  const input: Partial<Record<keyof TelemetryHeartbeatInput, unknown>> = heartbeat ?? {}
  const sanitized: TelemetryHeartbeatInput = {
    channel: isOneOf(TELEMETRY_CHANNELS, input.channel)
      ? (input.channel as TelemetryHeartbeatInput['channel'])
      : 'unknown',
    hubLanguage: isOneOf(TELEMETRY_HUB_LANGUAGES, input.hubLanguage)
      ? (input.hubLanguage as TelemetryHeartbeatInput['hubLanguage'])
      : 'other'
  }
  const templateVersion = normalizeVersion(input.templateVersion)
  if (templateVersion) sanitized.templateVersion = templateVersion
  const counts: Array<'projects' | 'programs' | 'parentProjects'> = [
    'projects',
    'programs',
    'parentProjects'
  ]
  counts.forEach((key) => {
    const count = heartbeatCount(input[key])
    if (count !== undefined) sanitized[key] = count
  })
  return sanitized
}

/**
 * The length of a text in bytes when it is sent as UTF-8. Counted by hand: jsdom, which the tests
 * run under, has no `TextEncoder`.
 */
export function utf8ByteLength(text: string): number {
  let bytes = 0
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index)
    if (code < 0x80) bytes += 1
    else if (code < 0x800) bytes += 2
    else if (code >= 0xd800 && code <= 0xdbff) {
      // A surrogate pair is one character of four bytes.
      bytes += 4
      index++
    } else bytes += 3
  }
  return bytes
}
