import * as fs from 'fs'
import * as path from 'path'
import {
  ITelemetryBatch,
  TELEMETRY_COMPONENTS,
  TELEMETRY_ERROR_CODES,
  TELEMETRY_EVENTS,
  TELEMETRY_FIELDS,
  TELEMETRY_HTTP_STATUSES,
  TELEMETRY_PATTERNS,
  TELEMETRY_SITE_TYPES,
  TELEMETRY_TIMING_METRICS
} from './contract'
import { attachTelemetryPortal, flushTelemetry } from './flush'
import { setupVariantFrom, siteTypeFromTemplate } from './setup'
import {
  HUB_SITE_ID,
  HUB_URL,
  hubPage,
  hubPortal,
  ITelemetryTestBed,
  PROJECT_SITE_ID,
  projectPage,
  settingsMap,
  settle,
  telemetryStore,
  telemetryTestBed,
  TENANT_ID
} from './__fixtures__/testFixtures'
import {
  queueHeartbeat,
  registerSiteTypeResolver,
  startTelemetry,
  trackError,
  trackTiming,
  trackUsage
} from './track'

/**
 * The golden batch, which Assist keeps a byte-identical copy of. Read from `src`: the compiled test
 * runs in `lib-commonjs/telemetry`, where the fixture is not copied.
 */
const FIXTURE_PATH = path.resolve(__dirname, '../../src/telemetry/__fixtures__/usage-batch-v1.json')
const fixture: ITelemetryBatch = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'))

/** The digest whose first 16 hex characters are the given hash. */
function digestOf(hash: string): number[] {
  const bytes: number[] = []
  for (let index = 0; index < 32; index++) {
    bytes.push(parseInt(hash.substring(index * 2, index * 2 + 2) || '0', 16))
  }
  return bytes
}

/** Asserts that an object has no field the contract does not name for it. */
function expectFields(value: object, fields: readonly string[]): void {
  Object.keys(value).forEach((key) => expect(fields).toContain(key))
}

let bed: ITelemetryTestBed

beforeEach(() => {
  bed = telemetryTestBed()
})

afterEach(() => bed.restore())

describe('the batch', () => {
  it('is the golden fixture, field for field and in the same order', async () => {
    bed.stubCrypto({
      randomUUID: () => fixture.batchId,
      digest: (text) =>
        digestOf(text.indexOf(HUB_SITE_ID) === -1 ? fixture.sites[1].h : fixture.sites[0].h)
    })
    // The Footer and the overview on the hub's front page, opened by someone who manages the hub.
    startTelemetry(hubPage({ canManageHub: true }))
    attachTelemetryPortal(hubPortal(), settingsMap('2', '1'))
    queueHeartbeat({
      channel: 'main',
      templateVersion: '1.15.0',
      hubLanguage: 'nb-NO',
      projects: 412,
      programs: 7,
      parentProjects: 12
    })
    for (let view = 0; view < 5; view++) trackUsage('Footer', 'page.viewed')
    for (let load = 0; load < 3; load++) trackUsage('PortfolioOverviewWebPart', 'loaded')
    // On to a new site of the hub, where the setup runs for the first time.
    startTelemetry(projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, () =>
      Promise.resolve(siteTypeFromTemplate({ isProgram: false, isParentProject: false }))
    )
    trackUsage('ProjectSetup', 'setup.completed', setupVariantFrom(undefined))
    await settle()
    flushTelemetry({ urgent: true })

    expect(bed.fetch).toHaveBeenCalledTimes(1)
    const body = bed.fetch.mock.calls[0][1].body as string
    expect(JSON.parse(body)).toEqual(fixture)
    expect(body).toBe(JSON.stringify(fixture))
  })

  it('holds only fields and values of the contract, at every level', async () => {
    startTelemetry(hubPage({ canManageHub: true }))
    attachTelemetryPortal(hubPortal(), settingsMap('3'))
    queueHeartbeat({ channel: 'test', hubLanguage: 'en-US', projects: 1 })
    trackUsage('Footer', 'page.viewed')
    trackUsage('IdeaRegistration', 'idea.recommended', 'consider')
    trackError('PortfolioOverviewWebPart', { status: 429 })
    trackError('ProjectSetup', 'provisioning_failed')
    trackTiming('PortfolioOverviewWebPart', 'init', 1234)
    startTelemetry(projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, () => Promise.resolve('program'))
    trackUsage('ProjectStatusWebPart', 'statusReport.published')
    await settle()
    flushTelemetry({ urgent: true })

    const body = bed.fetch.mock.calls[0][1].body as string
    const batch: ITelemetryBatch = JSON.parse(body)
    expectFields(batch, TELEMETRY_FIELDS.envelope)
    expect(batch.schema).toBe(1)
    expect(batch.batchId).toMatch(TELEMETRY_PATTERNS.guid)
    expect(batch.host).toMatch(TELEMETRY_PATTERNS.host)
    expect(batch.tenantId).toBe(TENANT_ID)
    expect(batch.hubUrl).toBe(HUB_URL)
    expect(batch.appVersion).toMatch(TELEMETRY_PATTERNS.version)
    expectFields(batch.heartbeat, TELEMETRY_FIELDS.heartbeat)

    expect(batch.usage).toHaveLength(3)
    batch.usage.forEach((entry) => {
      expectFields(entry, TELEMETRY_FIELDS.usage)
      expect(TELEMETRY_COMPONENTS).toContain(entry.c)
      expect(TELEMETRY_EVENTS[entry.e].components).toContain(entry.c)
      expect(TELEMETRY_SITE_TYPES).toContain(entry.s)
      if ('v' in entry) expect(TELEMETRY_EVENTS[entry.e].variants).toContain(entry.v)
      expect(entry.n).toBeGreaterThanOrEqual(1)
    })
    expect(batch.sites).toHaveLength(2)
    batch.sites.forEach((site) => {
      expectFields(site, TELEMETRY_FIELDS.sites)
      expect(site.h).toMatch(TELEMETRY_PATTERNS.siteHash)
      expect(TELEMETRY_SITE_TYPES).toContain(site.s)
    })
    expect(batch.errors).toHaveLength(2)
    batch.errors.forEach((entry) => {
      expectFields(entry, TELEMETRY_FIELDS.errors)
      expect(TELEMETRY_COMPONENTS).toContain(entry.c)
      expect(TELEMETRY_ERROR_CODES).toContain(entry.code)
      if ('http' in entry) expect(TELEMETRY_HTTP_STATUSES).toContain(entry.http)
    })
    expect(batch.timings).toEqual([
      { c: 'PortfolioOverviewWebPart', m: 'init', h: [0, 0, 0, 1, 0, 0, 0] }
    ])
    batch.timings.forEach((entry) => {
      expectFields(entry, TELEMETRY_FIELDS.timings)
      expect(TELEMETRY_TIMING_METRICS).toContain(entry.m)
    })

    // No site id leaves the browser, in any form, and the hub's is the only URL.
    expect(body).not.toContain(HUB_SITE_ID)
    expect(body).not.toContain(PROJECT_SITE_ID)
    expect(body).not.toContain(HUB_SITE_ID.replace(/-/g, ''))
    expect(body.split('https://')).toHaveLength(2)
    expect(body).not.toContain('@')
  })

  it("drops a component, an event or a variant that holds '/', '@' or 'http'", async () => {
    startTelemetry(hubPage())
    attachTelemetryPortal(hubPortal(), settingsMap('3'))
    const values = [
      'https://contoso.sharepoint.com/sites/prosjekt-a',
      'http',
      'sites/prosjekt-a',
      'kari.nordmann@contoso.com',
      'Footer/page.viewed',
      'Footer@hub'
    ]
    values.forEach((value) => {
      trackUsage(value as never, 'loaded')
      trackUsage(value as never, 'page.viewed')
      trackUsage('Footer' as never, value as never)
      trackUsage('Footer' as never, `page.viewed${value}` as never)
      trackUsage('ProjectSetup', 'setup.completed', value as never)
      trackUsage('Footer', 'page.viewed', value as never)
      trackError(value as never, 'render_failed')
      trackTiming(value as never, 'init', 10)
      trackTiming('Footer', value as never, 10)
    })
    expect(telemetryStore().usage).toEqual({})
    expect(telemetryStore().errors).toEqual({})
    expect(telemetryStore().timings).toEqual({})

    // As an error such a text is no code: it counts as unknown, and the text stays behind.
    values.forEach((value) => trackError('Footer', value))
    await settle()
    flushTelemetry({ urgent: true })
    const body = bed.fetch.mock.calls[0][1].body as string
    expect(JSON.parse(body).errors).toEqual([{ c: 'Footer', code: 'unknown', n: values.length }])
    expect(JSON.parse(body)).not.toHaveProperty('usage')
    expect(body).not.toContain('prosjekt-a')
    expect(body).not.toContain('kari')
  })
})
