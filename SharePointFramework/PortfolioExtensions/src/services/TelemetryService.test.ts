// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter hands out the test's stand-in for the hub's
// data service, which the gate reads the hub's settings through.
const mockAdapter: { portalDataService: any } = { portalDataService: undefined }
jest.mock('data/SPDataAdapter', () => ({ __esModule: true, default: mockAdapter }))

import {
  attachTelemetryPortal,
  getTelemetryGate,
  startTelemetry,
  trackUsage
} from 'pp365-shared-library/lib/telemetry'
import {
  HOST,
  HUB_URL,
  hubPage,
  hubPortal,
  ITelemetryTestBed,
  settingsMap,
  settle,
  spfxTestContext,
  telemetryTestBed,
  TENANT_ID
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import { DEFAULT_CATALOG_URL } from './catalogUrl'
import { ITelemetryEvent, ITelemetryServiceProps, TelemetryService } from './TelemetryService'

/**
 * The catalog's events under the one gate every sender asks: they are sent only when the hub's
 * usage statistics are at Standard or Utvidet and `CatalogTelemetryEnabled` is exactly `1`, only
 * for the default catalog, and never with an error's message or a client timestamp. The hub is a
 * stand-in whose settings each test sets; `fetch` is the test bed's, and records what is posted.
 */
const CATALOG_EVENTS_URL = 'https://assist.prosjektportalen.no/api/telemetry/catalog'
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const INSTALLED: ITelemetryEvent = {
  action: 'install',
  status: 'success',
  packageId: 'Byggprosjekt',
  packageVersion: '2.0.0',
  packageType: 'template',
  ppVersion: '1.15.0'
}

/** A failed update, with an error whose message names a site. */
const FAILED: ITelemetryEvent = {
  ...INSTALLED,
  action: 'update',
  status: 'error',
  previousVersion: '1.9.0',
  error: Object.assign(new Error('https://contoso.sharepoint.com/sites/hemmelig svarte 403'), {
    status: 403
  })
}

let bed: ITelemetryTestBed

/** The command set's props on the hub's template options list. */
function props(overrides: Partial<ITelemetryServiceProps> = {}): ITelemetryServiceProps {
  return { context: spfxTestContext({ alias: 'TemplatePackageCatalog' }) as any, ...overrides }
}

/**
 * The hub with these settings, as the command set leaves it when it has started: usage statistics
 * know the page, and the adapter's data service is attached without settings, so the gate has
 * read them through it.
 */
async function hubWith(settings: Map<string, string>, portal: Record<string, any> = {}) {
  mockAdapter.portalDataService = hubPortal(settings, portal)
  startTelemetry(hubPage())
  attachTelemetryPortal(mockAdapter.portalDataService)
  await settle()
  return mockAdapter.portalDataService
}

/** The requests posted to the catalog's endpoint, as `[url, options]`. */
const catalogRequests = (url = CATALOG_EVENTS_URL) =>
  bed.fetch.mock.calls.filter(([requestUrl]) => requestUrl === url)

/** The events posted to the catalog's endpoint. */
const catalogEvents = () => catalogRequests().map(([, options]) => JSON.parse(String(options.body)))

beforeEach(() => {
  bed = telemetryTestBed()
  mockAdapter.portalDataService = undefined
})

afterEach(() => bed.restore())

describe('TelemetryService, what a catalog event holds', () => {
  it('posts the event with the level, and no error text or client time', async () => {
    await hubWith(settingsMap('2'))
    await TelemetryService.track(props(), INSTALLED)
    expect(catalogEvents()).toEqual([
      {
        eventId: expect.stringMatching(GUID),
        action: 'install',
        status: 'success',
        packageId: 'Byggprosjekt',
        packageVersion: '2.0.0',
        packageType: 'template',
        ppVersion: '1.15.0',
        tenantId: TENANT_ID,
        host: HOST,
        siteUrl: HUB_URL,
        level: 2
      }
    ])
  })

  it('posts it as JSON that outlives the page, without cookies and without the page address', async () => {
    await hubWith(settingsMap('2'))
    await TelemetryService.track(props(), INSTALLED)
    const [[, options]] = catalogRequests()
    expect(options).toEqual({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: expect.any(String),
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: expect.any(AbortSignal)
    })
  })

  it.each([
    ['at level 3, for a failure', '3', FAILED, 'permission_denied'],
    ['at level 3, for a failure without an error', '3', { ...FAILED, error: undefined }, 'unknown'],
    ['at level 3, for a success', '3', INSTALLED, undefined],
    ['at level 2, for a failure', '2', FAILED, undefined]
  ])('sends an error code only %s', async (_, level, event, errorCode) => {
    await hubWith(settingsMap(level))
    await TelemetryService.track(props(), event as ITelemetryEvent)
    const [sent] = catalogEvents()
    expect(sent.level).toBe(Number(level))
    expect(sent.errorCode).toBe(errorCode)
    expect('errorCode' in sent).toBe(errorCode !== undefined)
  })

  it("never sends an error's message, or a time from the browser", async () => {
    await hubWith(settingsMap('3'))
    // A 1.14 caller's fields, which the types no longer have.
    const event = { ...FAILED, errorMessage: 'Listen Hemmelig finnes ikke', clientTs: 'nå' }
    await TelemetryService.track(props(), event as unknown as ITelemetryEvent)
    const [[, options]] = catalogRequests()
    expect(Object.keys(JSON.parse(String(options.body))).sort()).toEqual(
      [
        'action',
        'errorCode',
        'eventId',
        'host',
        'level',
        'packageId',
        'packageType',
        'packageVersion',
        'ppVersion',
        'previousVersion',
        'siteUrl',
        'status',
        'tenantId'
      ].sort()
    )
    expect(String(options.body)).not.toMatch(/hemmelig|errorMessage|clientTs/i)
  })

  it.each([
    ['whether the taxonomy was skipped', { taxonomySkipped: true }, { taxonomySkipped: true }],
    ['that it was not', { taxonomySkipped: false }, { taxonomySkipped: false }],
    ['the kind of registration removed', { removedType: 'Sentral' }, { removedType: 'Sentral' }],
    ['nothing beside it', { taxonomySkipped: true, list: 'Hemmelig' }, { taxonomySkipped: true }],
    ['no other kind', { removedType: 'Hemmelig' }, undefined],
    ['no text for a flag', { taxonomySkipped: 'ja' }, undefined],
    ['no other field', { list: 'Hemmelig' }, undefined],
    ['nothing without it', undefined, undefined]
  ])('keeps of the detail %s', async (_, detail, sent) => {
    await hubWith(settingsMap('2'))
    // Cast: the types allow only the two details that are sent.
    await TelemetryService.track(props(), { ...INSTALLED, detail } as unknown as ITelemetryEvent)
    expect(catalogEvents()[0].detail).toEqual(sent)
  })
})

describe('TelemetryService, when a catalog event is sent', () => {
  it.each([
    ['Standard', '2'],
    ['Utvidet', '3']
  ])('sends at %s with the catalog row at 1', async (_, level) => {
    const portal = await hubWith(settingsMap(level))
    await TelemetryService.track(props(), INSTALLED)
    expect(catalogEvents()).toHaveLength(1)
    // The catalog holds no settings: the gate read them once, through the hub's own service.
    expect(portal.getGlobalSettings).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['usage statistics are off', settingsMap('0')],
    ['they are at Grunnleggende', settingsMap('1')],
    ['the hub has no level row, or a disabled one', settingsMap(undefined)],
    ['the level is no level', settingsMap('Standard')],
    ['the hub has no catalog row, or a disabled one', settingsMap('2', false)],
    ['the catalog row is not exactly 1', settingsMap('3', 'true')],
    ['the catalog row is empty', settingsMap('3', '')],
    ['the hub gave no settings', new Map<string, string>()]
  ])('sends nothing when %s', async (_, settings) => {
    await hubWith(settings)
    await TelemetryService.track(props(), INSTALLED)
    await TelemetryService.track(props(), FAILED)
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('stops all telemetry, not only its own, with the catalog row at 0', async () => {
    await hubWith(settingsMap('3', '0'))
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'catalog-opt-out' })
    trackUsage('TemplatePackageCatalog', 'catalog.opened')
    await TelemetryService.track(props(), INSTALLED)
    bed.leave()
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('sends nothing when the hub is out of reach', async () => {
    await hubWith(settingsMap('3'), { isAvailable: false })
    await TelemetryService.track(props(), INSTALLED)
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it.each([
    ["a customer's own catalog", 'https://katalog.example/catalog.json'],
    ['a copy of the default catalog elsewhere', `${DEFAULT_CATALOG_URL}?kopi=1`],
    ['the default catalog in another case', DEFAULT_CATALOG_URL.toUpperCase()]
  ])('sends nothing for %s', async (_, catalogUrl) => {
    await hubWith(settingsMap('3'))
    await TelemetryService.track(props({ catalogUrl }), INSTALLED)
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it.each([
    ['no catalog URL', undefined],
    ['an empty one', ''],
    ['a blank one', '   '],
    ['the default catalog', DEFAULT_CATALOG_URL],
    ['the default catalog with space around it', `  ${DEFAULT_CATALOG_URL} `]
  ])('sends for %s, which is the default catalog', async (_, catalogUrl) => {
    await hubWith(settingsMap('2'))
    await TelemetryService.track(props({ catalogUrl }), INSTALLED)
    expect(catalogEvents()).toHaveLength(1)
  })

  it('sends nothing with an empty telemetryUrl, and posts to another one when it is set', async () => {
    await hubWith(settingsMap('2'))
    await TelemetryService.track(props({ telemetryUrl: '' }), INSTALLED)
    expect(bed.fetch).not.toHaveBeenCalled()
    await TelemetryService.track(props({ telemetryUrl: 'https://logg.example/katalog' }), INSTALLED)
    expect(catalogRequests('https://logg.example/katalog')).toHaveLength(1)
    expect(catalogRequests()).toHaveLength(0)
  })

  it('sends nothing from a tab with the tester flag, or a browser that asks not to be tracked', async () => {
    await hubWith(settingsMap('3'))
    window.sessionStorage.setItem('PP_DISABLE_TELEMETRY', '1')
    await TelemetryService.track(props(), INSTALLED)
    window.sessionStorage.removeItem('PP_DISABLE_TELEMETRY')
    bed.setNavigator('globalPrivacyControl', true)
    await TelemetryService.track(props(), INSTALLED)
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('sends nothing before usage statistics have started on the page', async () => {
    mockAdapter.portalDataService = hubPortal(settingsMap('3'))
    await TelemetryService.track(props(), INSTALLED)
    await settle()
    await TelemetryService.track(props(), INSTALLED)
    expect(bed.fetch).not.toHaveBeenCalled()
    expect(mockAdapter.portalDataService.getGlobalSettings).not.toHaveBeenCalled()
  })

  it("attaches the hub's data service itself when the command set has not, and sends once the level is read", async () => {
    mockAdapter.portalDataService = hubPortal(settingsMap('2'))
    startTelemetry(hubPage())
    // The level is being read: the gate is closed, and the event is dropped.
    await TelemetryService.track(props(), INSTALLED)
    expect(bed.fetch).not.toHaveBeenCalled()
    await settle()
    await TelemetryService.track(props(), { ...INSTALLED, action: 'remove' })
    expect(catalogEvents().map((event) => event.action)).toEqual(['remove'])
    expect(mockAdapter.portalDataService.getGlobalSettings).toHaveBeenCalledTimes(1)
  })

  it('sends nothing once the decision is more than an hour old, and sends again when the level is read anew', async () => {
    const portal = await hubWith(settingsMap('2'))
    bed.advance(61 * 60 * 1000)
    await TelemetryService.track(props(), INSTALLED)
    expect(bed.fetch).not.toHaveBeenCalled()
    await settle()
    expect(portal.getGlobalSettings).toHaveBeenCalledTimes(2)
    await TelemetryService.track(props(), INSTALLED)
    expect(catalogEvents()).toHaveLength(1)
  })
})

describe('TelemetryService, when sending fails', () => {
  it('never fails the action that reports to it', async () => {
    await hubWith(settingsMap('2'))
    bed.fetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(TelemetryService.track(props(), INSTALLED)).resolves.toBeUndefined()
    // No retry: the event is lost.
    expect(bed.fetch).toHaveBeenCalledTimes(1)
  })

  it('gives up a request that hangs after ten seconds', async () => {
    await hubWith(settingsMap('2'))
    let signal: AbortSignal
    bed.fetch.mockImplementationOnce((_url: string, options: RequestInit) => {
      signal = options.signal
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('Aborted')))
      })
    })
    // The clock telemetry reads stays the test bed's; only the timers are taken over.
    jest.useFakeTimers({ doNotFake: ['Date'] })
    try {
      const tracking = TelemetryService.track(props(), INSTALLED)
      await jest.advanceTimersByTimeAsync(9999)
      expect(signal.aborted).toBe(false)
      await jest.advanceTimersByTimeAsync(1)
      expect(signal.aborted).toBe(true)
      await expect(tracking).resolves.toBeUndefined()
    } finally {
      jest.useRealTimers()
    }
  })
})
