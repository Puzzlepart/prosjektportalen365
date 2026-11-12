/**
 * Usage statistics: what the solutions count and send to Assist. See `contract.ts` for everything
 * that can be sent, `gate.ts` for when, and `store.ts` for where it is kept (in memory only).
 *
 * The export list is curated rather than a wildcard: the store, the batch builder and the limits
 * are implementation detail with names too generic for the package root.
 */
export {
  ITelemetryBatch,
  ITelemetryErrorEntry,
  ITelemetryHeartbeat,
  ITelemetrySiteEntry,
  ITelemetryTimingEntry,
  ITelemetryUsageEntry,
  TELEMETRY_COMPONENTS,
  TELEMETRY_ERROR_CODES,
  TELEMETRY_EVENTS,
  TELEMETRY_SCHEMA,
  TELEMETRY_SITE_TYPES,
  TELEMETRY_TIMING_METRICS,
  TelemetryChannel,
  TelemetryComponent,
  TelemetryErrorCode,
  TelemetryEvent,
  TelemetryEventComponent,
  TelemetryHttpStatus,
  TelemetryHubLanguage,
  TelemetryLevel,
  TelemetrySiteType,
  TelemetryTimingMetric,
  TelemetryVariant,
  USAGE_TELEMETRY_URL
} from './contract'
export { errorCodeFrom, errorHttpStatusFrom } from './errorCode'
export { attachTelemetryPortal, flushTelemetry, getTelemetryGate } from './flush'
export {
  DISABLE_TELEMETRY_FLAG,
  ITelemetryGate,
  ITelemetryGateInput,
  resolveTelemetryGate,
  TelemetryGateReason
} from './gate'
export { setupOutcomeEvent, setupVariantFrom, siteTypeFromTemplate } from './setup'
export { TelemetryResolvedSiteType } from './siteInfo'
export { ITelemetryPortal } from './store'
export {
  ITelemetryTracker,
  TelemetryContext,
  TelemetryProvider,
  useTelemetry
} from './TelemetryContext'
export {
  ITelemetryInit,
  ITelemetrySpfxContext,
  queueHeartbeat,
  registerSiteTypeResolver,
  startTelemetry,
  telemetryInitFromContext,
  trackError,
  trackTiming,
  trackUsage
} from './track'
export { isTelemetryComponent, TelemetryHeartbeatInput } from './validate'
