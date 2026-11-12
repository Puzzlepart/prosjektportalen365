import { GATE_MAX_AGE_MS } from './contract'
import { attachTelemetryPortal, flushTelemetry } from './flush'
import { DISABLE_TELEMETRY_FLAG } from './gate'
import {
  hubPage,
  hubPortal,
  ITelemetryTestBed,
  PROJECT_SITE_ID,
  projectPage,
  settingsMap,
  settle,
  telemetryTestBed
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
 * Telemetry keeps its state in memory only. Storing anything in the browser that is not strictly
 * necessary needs each user's consent, which a setting an administrator made cannot give, so the
 * module writes to no cookie and no storage, and reads one thing: the tester's flag.
 */
describe('telemetry and the browser', () => {
  let bed: ITelemetryTestBed
  const scope = globalThis as any

  beforeEach(() => {
    bed = telemetryTestBed()
    scope.indexedDB = { open: jest.fn(), deleteDatabase: jest.fn() }
    scope.caches = { open: jest.fn(), delete: jest.fn() }
  })

  afterEach(() => {
    delete scope.indexedDB
    delete scope.caches
    bed.restore()
  })

  /** A session at level 3 that uses every part of the module, and sends several times. */
  async function useEverything(): Promise<void> {
    startTelemetry(hubPage({ canManageHub: true }))
    const portal = hubPortal(settingsMap('3'))
    attachTelemetryPortal(portal)
    attachTelemetryPortal(hubPortal(), settingsMap('3'))
    await settle()
    queueHeartbeat({ channel: 'main', hubLanguage: 'nb-NO', projects: 4 })
    trackUsage('Footer', 'page.viewed')
    trackError('Footer', { status: 404 })
    trackTiming('PortfolioOverviewWebPart', 'init', 900)
    bed.hide()
    bed.show()

    startTelemetry(projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, () => Promise.resolve('project'))
    trackUsage('ProjectStatusWebPart', 'loaded')
    await settle()
    flushTelemetry({ urgent: true })

    // A decision that has grown old is read again.
    bed.advance(GATE_MAX_AGE_MS + 1)
    trackUsage('ProjectStatusWebPart', 'statusReport.created')
    await settle()
    bed.leave()
    expect(portal.getGlobalSettings).toHaveBeenCalledTimes(2)
    expect(bed.fetch).toHaveBeenCalledTimes(3)
  }

  it('writes to no storage, cookie, database or cache while it starts, counts and sends', async () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem')
    const removeItem = jest.spyOn(Storage.prototype, 'removeItem')
    const clear = jest.spyOn(Storage.prototype, 'clear')
    const cookie = jest.spyOn(Document.prototype, 'cookie', 'set')

    await useEverything()

    expect(setItem).not.toHaveBeenCalled()
    expect(removeItem).not.toHaveBeenCalled()
    expect(clear).not.toHaveBeenCalled()
    expect(cookie).not.toHaveBeenCalled()
    expect(scope.indexedDB.open).not.toHaveBeenCalled()
    expect(scope.indexedDB.deleteDatabase).not.toHaveBeenCalled()
    expect(scope.caches.open).not.toHaveBeenCalled()
    expect(scope.caches.delete).not.toHaveBeenCalled()
    expect(window.localStorage).toHaveLength(0)
    expect(window.sessionStorage).toHaveLength(0)
    expect(document.cookie).toBe('')
  })

  it("reads one thing from storage: the tester's flag in session storage", async () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem')
    const key = jest.spyOn(Storage.prototype, 'key')
    const cookie = jest.spyOn(Document.prototype, 'cookie', 'get')

    await useEverything()

    expect(getItem.mock.calls.length).toBeGreaterThan(0)
    getItem.mock.calls.forEach((call, index) => {
      expect(call).toEqual([DISABLE_TELEMETRY_FLAG])
      expect(getItem.mock.contexts[index]).toBe(window.sessionStorage)
    })
    expect(key).not.toHaveBeenCalled()
    expect(cookie).not.toHaveBeenCalled()
  })

  it('sends no cookie, no referrer and no header of its own with a batch', async () => {
    await useEverything()
    bed.fetch.mock.calls.forEach(([, options]) => {
      expect(options.credentials).toBe('omit')
      expect(options.referrerPolicy).toBe('no-referrer')
      expect(options.headers).toEqual({ 'content-type': 'text/plain;charset=UTF-8' })
    })
  })
})
