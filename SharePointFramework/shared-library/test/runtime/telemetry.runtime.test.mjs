/**
 * Telemetry in a real Node process, where there is no window: the integration tests run the
 * library's data layer that way, and the solutions' code calls telemetry as it goes. Jest runs
 * under jsdom, which always has a window, so only this file can show that every call is a no-op
 * there: nothing thrown, nothing kept, nothing sent.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const telemetry = require('../../lib-commonjs/telemetry/index.js')

const SITE_ID = '5c7d2f6a-3b1e-4d8c-9a0f-6e2b1c4d7f80'
const portal = {
  isAvailable: true,
  hubSiteId: SITE_ID,
  url: 'https://contoso.sharepoint.com/sites/prosjektportalen',
  getGlobalSettings: () => {
    throw new Error('Telemetry must not read the settings without a window')
  }
}

test('there is no window in this process', () => {
  assert.equal(typeof window, 'undefined')
})

test('every telemetry call is a no-op without a window', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', () => {
    throw new Error('Telemetry must not send without a window')
  })
  telemetry.startTelemetry({
    host: 'contoso.sharepoint.com',
    tenantId: '9a5c0f3e-1b2d-4c6e-8f70-1a2b3c4d5e6f',
    siteId: SITE_ID,
    hubSiteId: SITE_ID,
    isHubPage: true,
    appVersion: '1.15.0',
    isDebug: false,
    canManageHub: true
  })
  telemetry.attachTelemetryPortal(portal)
  telemetry.attachTelemetryPortal(portal, new Map([['UsageStatisticsLevel', '3']]))
  telemetry.registerSiteTypeResolver(SITE_ID, () => Promise.reject(new Error('not called')))
  telemetry.queueHeartbeat({ channel: 'main', hubLanguage: 'nb-NO' })
  telemetry.trackUsage('Footer', 'page.viewed')
  telemetry.trackError('Footer', new Error('boom'))
  telemetry.trackTiming('PortfolioOverviewWebPart', 'init', 120)
  telemetry.flushTelemetry({ urgent: true })
  telemetry.flushTelemetry()
  await new Promise((resolve) => setTimeout(resolve, 10))

  assert.deepEqual(telemetry.getTelemetryGate(), { level: 0, catalog: false, reason: 'pending' })
  assert.equal(globalThis.__pp365UsageV1, undefined)
  assert.equal(fetchMock.mock.callCount(), 0)
})

test('the pure helpers work as they do in the browser', () => {
  assert.equal(telemetry.errorCodeFrom({ status: 403 }), 'permission_denied')
  assert.equal(telemetry.setupVariantFrom('__SELECT_TEMPLATE__'), 'rerun')
  assert.deepEqual(
    telemetry.resolveTelemetryGate({
      hasAnchor: true,
      anchorAvailable: true,
      settings: new Map([
        ['UsageStatisticsLevel', '2'],
        ['CatalogTelemetryEnabled', '1']
      ])
    }),
    { level: 2, catalog: true, reason: 'setting' }
  )
})
