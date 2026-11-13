import * as telemetry from './index'

/**
 * What the solutions can import. The store, the batch builder and the limits stay inside the
 * module: a name added here becomes part of the package's root.
 */
describe('the telemetry barrel', () => {
  it('exports the tracking calls, the gate, the helpers and the contract, and nothing else', () => {
    expect(Object.keys(telemetry).sort()).toEqual(
      [
        'DISABLE_TELEMETRY_FLAG',
        'TELEMETRY_COMPONENTS',
        'TELEMETRY_ERROR_CODES',
        'TELEMETRY_EVENTS',
        'TELEMETRY_SCHEMA',
        'TELEMETRY_SITE_TYPES',
        'TELEMETRY_TIMING_METRICS',
        'TelemetryContext',
        'TelemetryProvider',
        'USAGE_TELEMETRY_URL',
        'attachTelemetryPortal',
        'errorCodeFrom',
        'errorHttpStatusFrom',
        'flushTelemetry',
        'getTelemetryGate',
        'hubLanguageFromLcid',
        'isTelemetryComponent',
        'queueHeartbeat',
        'readSiteType',
        'registerSiteTypeResolver',
        'requestHeartbeat',
        'resolveTelemetryGate',
        'setSiteType',
        'setupOutcomeEvent',
        'setupVariantFrom',
        'siteTypeFromTemplate',
        'startTelemetry',
        'telemetryInitFromContext',
        'trackError',
        'trackPageView',
        'trackTiming',
        'trackUsage',
        'useTelemetry'
      ].sort()
    )
    const exported: Record<string, unknown> = telemetry
    Object.keys(exported).forEach((name) => expect(exported[name]).toBeDefined())
  })

  it('exports functions that take no part in a promise chain: every tracking call is synchronous', () => {
    const results = [
      telemetry.startTelemetry(undefined),
      telemetry.trackUsage('Footer', 'page.viewed'),
      telemetry.trackPageView('Footer'),
      telemetry.trackError('Footer', 'render_failed'),
      telemetry.trackTiming('PortfolioOverviewWebPart', 'init', 10),
      telemetry.queueHeartbeat(undefined),
      telemetry.requestHeartbeat('nb-NO'),
      telemetry.registerSiteTypeResolver(undefined, undefined),
      telemetry.setSiteType(undefined, 'project'),
      telemetry.attachTelemetryPortal(undefined),
      telemetry.flushTelemetry()
    ]
    expect(results).toEqual(results.map(() => undefined))
    delete (window as any).__pp365UsageV1
  })
})
