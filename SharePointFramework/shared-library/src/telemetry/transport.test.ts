import type { PortalDataService } from '../services/PortalDataService/PortalDataService'
import {
  GATE_MAX_AGE_MS,
  ITelemetryUsageEntry,
  MAX_BATCH_BYTES,
  MAX_ERROR_ENTRIES,
  MAX_SENDS_PER_WINDOW,
  MAX_SITE_ENTRIES,
  MAX_TIMING_ENTRIES,
  MAX_USAGE_ENTRIES,
  MIN_SEND_INTERVAL_MS,
  TELEMETRY_COMPONENTS,
  TELEMETRY_ERROR_CODES,
  TELEMETRY_EVENTS,
  TELEMETRY_PATTERNS,
  TelemetryComponent,
  TelemetryEvent,
  USAGE_TELEMETRY_URL
} from './contract'
import { attachTelemetryPortal, flushTelemetry, getTelemetryGate } from './flush'
import { DISABLE_TELEMETRY_FLAG } from './gate'
import {
  HUB_SITE_ID,
  HUB_URL,
  hubPage,
  hubPortal,
  ITelemetryTestBed,
  OTHER_HUB_SITE_ID,
  OTHER_HUB_URL,
  PROJECT_SITE_ID,
  projectPage,
  settingsMap,
  settle,
  sha256,
  telemetryStore,
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

let bed: ITelemetryTestBed

beforeEach(() => {
  bed = telemetryTestBed()
})

afterEach(() => bed.restore())

/** A hub page whose hub's settings the bundle already holds: the gate is decided at once. */
async function startOnHub(level: string = '2', catalog: string = '1'): Promise<void> {
  startTelemetry(hubPage())
  attachTelemetryPortal(hubPortal(), settingsMap(level, catalog))
  await settle()
}

/** Counts every usage event the contract has, for each of its components and variants. */
function trackEverything(): number {
  let count = 0
  ;(Object.keys(TELEMETRY_EVENTS) as TelemetryEvent[]).forEach((event) => {
    const definition: { components: readonly TelemetryComponent[]; variants: readonly string[] } =
      TELEMETRY_EVENTS[event]
    definition.components.forEach((component) => {
      ;[undefined, ...definition.variants].forEach((variant) => {
        trackUsage(component, event, variant as never)
        count++
      })
    })
  })
  return count
}

describe('the transport', () => {
  it('posts a batch with exactly these options, and no other header', async () => {
    await startOnHub()
    trackUsage('Footer', 'page.viewed')
    flushTelemetry({ urgent: true })

    expect(bed.fetch).toHaveBeenCalledTimes(1)
    const [url, options] = bed.fetch.mock.calls[0]
    expect(url).toBe(USAGE_TELEMETRY_URL)
    expect(options).toEqual({
      method: 'POST',
      body: expect.any(String),
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      mode: 'cors',
      headers: { 'content-type': 'text/plain;charset=UTF-8' }
    })
    expect(Object.keys(options).sort()).toEqual([
      'body',
      'cache',
      'credentials',
      'headers',
      'keepalive',
      'method',
      'mode',
      'referrerPolicy'
    ])
    expect(Object.keys(options.headers)).toEqual(['content-type'])
    expect(JSON.parse(options.body as string)).toMatchObject({
      schema: 1,
      level: 2,
      hubUrl: HUB_URL,
      usage: [{ c: 'Footer', e: 'page.viewed', s: 'hub', n: 1 }]
    })
  })

  it('never uses sendBeacon, which always sends cookies', async () => {
    const sendBeacon = jest.fn()
    bed.setNavigator('sendBeacon', sendBeacon)
    await startOnHub()
    trackUsage('Footer', 'page.viewed')
    bed.hide()
    trackUsage('Footer', 'help.opened')
    bed.leave()
    trackUsage('Footer', 'assistant.opened')
    flushTelemetry({ urgent: true })

    expect(bed.fetch).toHaveBeenCalledTimes(3)
    expect(sendBeacon).not.toHaveBeenCalled()
  })

  it('does not wait for the network: the request is out when the flush returns', async () => {
    await startOnHub()
    bed.fetch.mockImplementation(() => new Promise(() => undefined))
    trackUsage('Footer', 'page.viewed')
    flushTelemetry({ urgent: true })
    expect(bed.fetch).toHaveBeenCalledTimes(1)
    expect(telemetryStore().usage).toEqual({})
  })

  it('sends nothing at level 0, and keeps nothing', async () => {
    await startOnHub('0')
    trackUsage('Footer', 'page.viewed')
    trackError('Footer', 'render_failed')
    trackTiming('PortfolioOverviewWebPart', 'init', 120)
    bed.hide()
    bed.leave()
    flushTelemetry({ urgent: true })

    expect(bed.fetch).not.toHaveBeenCalled()
    expect(telemetryStore().usage).toEqual({})
    expect(telemetryStore().errors).toEqual({})
    expect(telemetryStore().timings).toEqual({})
  })

  it.each([
    ['the tester flag', (): void => window.sessionStorage.setItem(DISABLE_TELEMETRY_FLAG, '1')],
    ['Global Privacy Control', (): void => bed.setNavigator('globalPrivacyControl', true)],
    ['Do Not Track', (): void => bed.setNavigator('doNotTrack', '1')]
  ])('sends nothing with %s, whatever the level', async (_signal, arrange) => {
    arrange()
    await startOnHub('3')
    trackUsage('Footer', 'page.viewed')
    bed.leave()
    expect(getTelemetryGate().level).toBe(0)
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  // A tester sets the flag in the console of a page that has already decided and counted, and the
  // decision is used for an hour: the signals are read again whenever something is about to go.
  it.each([
    [
      'the tester flag',
      'tester-flag',
      (): void => window.sessionStorage.setItem(DISABLE_TELEMETRY_FLAG, '1')
    ],
    [
      'Global Privacy Control',
      'privacy-signal',
      (): void => bed.setNavigator('globalPrivacyControl', true)
    ],
    ['Do Not Track', 'privacy-signal', (): void => bed.setNavigator('doNotTrack', '1')]
  ])(
    'sends nothing once %s is set, also when the gate had decided before it',
    async (_signal, reason, arrange) => {
      await startOnHub('3')
      trackUsage('Footer', 'page.viewed')
      trackError('Footer', 'render_failed')
      trackTiming('PortfolioOverviewWebPart', 'init', 120)
      expect(getTelemetryGate()).toEqual({ level: 3, catalog: true, reason: 'setting' })

      arrange()
      bed.hide()
      bed.leave()
      flushTelemetry({ urgent: true })
      expect(bed.fetch).not.toHaveBeenCalled()
      expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason })
      // What was counted before the signal is dropped, and nothing is counted after it.
      trackUsage('Footer', 'page.viewed')
      const { usage, errors, timings } = telemetryStore()
      expect([usage, errors, timings]).toEqual([{}, {}, {}])
    }
  )

  it('answers a sender that asks the gate after the tester flag is set, before any flush', async () => {
    startTelemetry(hubPage())
    const anchor = hubPortal(settingsMap('2'))
    attachTelemetryPortal(anchor)
    await settle()
    expect(getTelemetryGate()).toEqual({ level: 2, catalog: true, reason: 'setting' })

    window.sessionStorage.setItem(DISABLE_TELEMETRY_FLAG, '1')
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'tester-flag' })

    // The flag taken away again opens nothing by itself: the settings are read anew first.
    window.sessionStorage.removeItem(DISABLE_TELEMETRY_FLAG)
    expect(getTelemetryGate().level).toBe(0)
    bed.advance(GATE_MAX_AGE_MS + 1)
    trackUsage('Footer', 'page.viewed')
    await settle()
    expect(anchor.getGlobalSettings).toHaveBeenCalledTimes(2)
    expect(getTelemetryGate()).toEqual({ level: 2, catalog: true, reason: 'setting' })
  })

  it('reads the signals before it looks at the time since the last send', async () => {
    await startOnHub()
    trackUsage('Footer', 'page.viewed')
    bed.hide()
    expect(bed.fetch).toHaveBeenCalledTimes(1)

    bed.show()
    trackUsage('Footer', 'help.opened')
    bed.setNavigator('globalPrivacyControl', true)
    // Too soon after the last send for a hidden tab to send: what was counted is dropped all the same.
    bed.hide()
    expect(telemetryStore().decision).toMatchObject({ level: 0, reason: 'privacy-signal' })
    expect(telemetryStore().usage).toEqual({})
    bed.leave()
    expect(bed.fetch).toHaveBeenCalledTimes(1)
  })

  it('sends nothing before the gate has decided, and what was counted goes when it has', async () => {
    startTelemetry(hubPage())
    trackUsage('Footer', 'page.viewed')
    flushTelemetry({ urgent: true })
    bed.leave()
    expect(bed.fetch).not.toHaveBeenCalled()

    // The settings read is still on its way: still nothing.
    let answer: (settings: Map<string, string>) => void
    const portal = hubPortal()
    portal.getGlobalSettings.mockReturnValue(new Promise((resolve) => (answer = resolve)))
    attachTelemetryPortal(portal)
    await settle()
    flushTelemetry({ urgent: true })
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'pending' })
    expect(bed.fetch).not.toHaveBeenCalled()

    answer(settingsMap('2'))
    await settle()
    flushTelemetry({ urgent: true })
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].usage).toEqual([{ c: 'Footer', e: 'page.viewed', s: 'hub', n: 1 }])
  })

  it('closes the gate when the settings cannot be read or the hub is not available', async () => {
    startTelemetry(hubPage())
    const portal = hubPortal()
    portal.getGlobalSettings.mockRejectedValue(new Error('[403] Forbidden'))
    attachTelemetryPortal(portal)
    await settle()
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'no-level' })

    bed.restore()
    bed = telemetryTestBed()
    startTelemetry(hubPage())
    attachTelemetryPortal(hubPortal(settingsMap('3'), { isAvailable: false }), settingsMap('3'))
    expect(getTelemetryGate().reason).toBe('anchor-unavailable')
    trackUsage('Footer', 'page.viewed')
    bed.leave()
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('a DEBUG build resolves the gate, logs each batch and never sends', async () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => undefined)
    startTelemetry(hubPage({ isDebug: true }))
    // A production bundle on the same page does not turn sending back on.
    startTelemetry(hubPage({ isDebug: false }))
    attachTelemetryPortal(hubPortal(), settingsMap('2'))
    await settle()
    expect(getTelemetryGate().level).toBe(2)
    trackUsage('Footer', 'page.viewed')
    flushTelemetry({ urgent: true })
    trackUsage('Footer', 'page.viewed')
    bed.leave()

    expect(bed.fetch).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalledTimes(2)
    expect(info.mock.calls[0][1]).toMatchObject({
      schema: 1,
      level: 2,
      usage: [{ c: 'Footer', e: 'page.viewed', s: 'hub', n: 1 }]
    })
  })

  it('swallows every error of the request, and does not try again', async () => {
    await startOnHub()
    bed.fetch.mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')))
    trackUsage('Footer', 'page.viewed')
    expect(() => flushTelemetry({ urgent: true })).not.toThrow()
    await settle()

    bed.fetch.mockImplementation(() => {
      throw new Error('fetch is blocked')
    })
    trackUsage('Footer', 'page.viewed')
    expect(() => flushTelemetry({ urgent: true })).not.toThrow()

    bed.fetch.mockImplementation(() => undefined)
    trackUsage('Footer', 'page.viewed')
    expect(() => bed.leave()).not.toThrow()
    expect(bed.fetch).toHaveBeenCalledTimes(3)

    // Each of the three was dropped: the next flush has nothing left of them.
    bed.fetch.mockClear()
    flushTelemetry({ urgent: true })
    expect(bed.fetch).not.toHaveBeenCalled()

    delete (globalThis as any).fetch
    trackUsage('Footer', 'page.viewed')
    expect(() => flushTelemetry({ urgent: true })).not.toThrow()
  })

  it('splits what it sends into batches within the byte and entry limits', async () => {
    await startOnHub('3')
    const siteTypes = ['project', 'program', 'parent', 'other'] as const
    let usageCount = trackEverything()
    siteTypes.forEach((siteType, index) => {
      const siteId = `${index}${PROJECT_SITE_ID.substring(1)}`
      startTelemetry(projectPage({ siteId }))
      registerSiteTypeResolver(siteId, () => Promise.resolve(siteType))
      usageCount += trackEverything()
    })
    TELEMETRY_COMPONENTS.forEach((component) => {
      TELEMETRY_ERROR_CODES.forEach((code) => trackError(component, code))
      trackTiming(component, 'init', 300)
    })
    await settle()
    flushTelemetry({ urgent: true })

    const bodies = bed.fetch.mock.calls.map(([, options]) => options.body as string)
    expect(bodies.length).toBeGreaterThanOrEqual(4)
    bodies.forEach((body) => {
      // ASCII only, so the length of the text is its length in bytes.
      expect(body).toMatch(/^[\x20-\x7e]*$/)
      expect(body.length).toBeLessThanOrEqual(MAX_BATCH_BYTES)
    })
    expect(bodies.join('').length).toBeGreaterThan(2 * MAX_BATCH_BYTES)

    const batches = bed.batches()
    batches.forEach((batch) => {
      expect(batch).toMatchObject({ schema: 1, level: 3, hubUrl: HUB_URL, appVersion: '1.15.0' })
      expect(batch.usage?.length ?? 0).toBeLessThanOrEqual(MAX_USAGE_ENTRIES)
      expect(batch.sites?.length ?? 0).toBeLessThanOrEqual(MAX_SITE_ENTRIES)
      expect(batch.errors?.length ?? 0).toBeLessThanOrEqual(MAX_ERROR_ENTRIES)
      expect(batch.timings?.length ?? 0).toBeLessThanOrEqual(MAX_TIMING_ENTRIES)
      expect(!!batch.sites).toBe(!!batch.usage)
    })
    expect(new Set(batches.map((batch) => batch.batchId)).size).toBe(batches.length)

    // Nothing is lost and nothing is sent twice.
    const usage = batches.reduce<ITelemetryUsageEntry[]>(
      (all, batch) => all.concat(batch.usage ?? []),
      []
    )
    expect(usage).toHaveLength(usageCount)
    expect(new Set(usage.map(({ c, e, s, v }) => [c, e, s, v].join('|'))).size).toBe(usageCount)
    expect(new Set(usage.map(({ s }) => s))).toEqual(new Set(['hub', ...siteTypes]))
    const errorCount = batches.reduce((sum, batch) => sum + (batch.errors?.length ?? 0), 0)
    expect(errorCount).toBe(TELEMETRY_COMPONENTS.length * TELEMETRY_ERROR_CODES.length)
    const timingCount = batches.reduce((sum, batch) => sum + (batch.timings?.length ?? 0), 0)
    expect(timingCount).toBe(TELEMETRY_COMPONENTS.length)
    expect(telemetryStore().usage).toEqual({})
  })

  it('lists at most 50 sites in a batch: the usage of the 51st site goes in the next one', async () => {
    bed.stubCrypto({ digest: sha256 })
    await startOnHub()
    for (let site = 0; site <= MAX_SITE_ENTRIES; site++) {
      const siteId = `${String(site).padStart(2, '0')}${PROJECT_SITE_ID.substring(2)}`
      startTelemetry(projectPage({ siteId }))
      registerSiteTypeResolver(siteId, () => Promise.resolve('project'))
      trackUsage('ProjectStatusWebPart', 'loaded')
    }
    await settle()
    flushTelemetry({ urgent: true })

    const batches = bed.batches()
    expect(batches.map((batch) => batch.sites.length)).toEqual([MAX_SITE_ENTRIES, 1])
    // One entry per batch, since every site is a project: its count is the batch's own sites.
    expect(batches.map((batch) => batch.usage)).toEqual([
      [{ c: 'ProjectStatusWebPart', e: 'loaded', s: 'project', n: MAX_SITE_ENTRIES }],
      [{ c: 'ProjectStatusWebPart', e: 'loaded', s: 'project', n: 1 }]
    ])
    const hashes = batches.reduce<string[]>(
      (all, batch) => all.concat(batch.sites.map((site) => site.h)),
      []
    )
    expect(new Set(hashes).size).toBe(MAX_SITE_ENTRIES + 1)
    expect(telemetryStore().usage).toEqual({})
  })

  it('sends from a hidden tab only when the last send is at least 60 seconds old', async () => {
    await startOnHub()
    trackUsage('Footer', 'page.viewed')
    bed.hide()
    expect(bed.fetch).toHaveBeenCalledTimes(1)

    bed.show()
    trackUsage('Footer', 'page.viewed')
    bed.advance(MIN_SEND_INTERVAL_MS - 1)
    bed.hide()
    expect(bed.fetch).toHaveBeenCalledTimes(1)

    // The counters kept summing in the meantime.
    bed.show()
    trackUsage('Footer', 'page.viewed')
    bed.advance(1)
    bed.hide()
    expect(bed.fetch).toHaveBeenCalledTimes(2)
    expect(bed.batches()[1].usage).toEqual([{ c: 'Footer', e: 'page.viewed', s: 'hub', n: 2 }])

    // A hidden tab with nothing new sends nothing.
    bed.advance(MIN_SEND_INTERVAL_MS)
    bed.show()
    bed.hide()
    expect(bed.fetch).toHaveBeenCalledTimes(2)
  })

  it('always sends when the page goes away or code asks for an urgent flush', async () => {
    await startOnHub()
    trackUsage('Footer', 'page.viewed')
    bed.hide()
    trackUsage('Footer', 'help.opened')
    bed.leave()
    trackUsage('Footer', 'assistant.opened')
    flushTelemetry({ urgent: true })
    trackUsage('Footer', 'page.viewed')
    flushTelemetry()

    expect(bed.batches().map((batch) => batch.usage[0].e)).toEqual([
      'page.viewed',
      'help.opened',
      'assistant.opened'
    ])
  })

  it('gives every batch a random id of its own, also in a browser without randomUUID', async () => {
    await startOnHub()
    trackUsage('Footer', 'page.viewed')
    flushTelemetry({ urgent: true })
    delete (globalThis as any).crypto.randomUUID
    trackUsage('Footer', 'page.viewed')
    flushTelemetry({ urgent: true })
    trackUsage('Footer', 'page.viewed')
    flushTelemetry({ urgent: true })

    const ids = bed.batches().map((batch) => batch.batchId)
    ids.forEach((id) => expect(id).toMatch(TELEMETRY_PATTERNS.guid))
    expect(ids[1]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(new Set(ids).size).toBe(3)
  })

  it('sends at most 500 times from one window', async () => {
    await startOnHub()
    for (let send = 0; send < MAX_SENDS_PER_WINDOW + 5; send++) {
      trackUsage('Footer', 'page.viewed')
      if (send % 2) bed.leave()
      else flushTelemetry({ urgent: true })
    }
    expect(bed.fetch).toHaveBeenCalledTimes(MAX_SENDS_PER_WINDOW)
    expect(telemetryStore().sendCount).toBe(MAX_SENDS_PER_WINDOW)
  })

  it('stops at the 500th send in the middle of a flush that makes several batches', async () => {
    await startOnHub('3')
    TELEMETRY_COMPONENTS.forEach((component) => {
      TELEMETRY_ERROR_CODES.forEach((code) => trackError(component, code))
    })
    telemetryStore().sendCount = MAX_SENDS_PER_WINDOW - 1
    flushTelemetry({ urgent: true })
    expect(bed.fetch).toHaveBeenCalledTimes(1)
    expect(bed.batches()[0].errors).toHaveLength(MAX_ERROR_ENTRIES)
    // No retry: what did not go is gone.
    expect(telemetryStore().errors).toEqual({})
  })

  it('never throws from a flush, a gate lookup or an event, even when the clock does', async () => {
    await startOnHub()
    trackUsage('Footer', 'page.viewed')
    jest.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('no clock')
    })
    expect(() => flushTelemetry({ urgent: true })).not.toThrow()
    expect(() => bed.hide()).not.toThrow()
    expect(() => bed.show()).not.toThrow()
    expect(() => bed.leave()).not.toThrow()
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'pending' })
    expect(bed.fetch).not.toHaveBeenCalled()
  })
})

describe('the anchor portal', () => {
  it('can be the real PortalDataService: the compiler checks that its shape fits', () => {
    // A type import only, erased when compiled: no test loads PnPjs.
    const attach: (portal: PortalDataService) => void = attachTelemetryPortal
    expect(attach).toBe(attachTelemetryPortal)
  })

  it("takes the hub URL from the anchor only, as the hub's address and nothing more", async () => {
    startTelemetry(projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, () => Promise.resolve('project'))
    const portal = hubPortal(settingsMap('2'), {
      hubSiteId: `{${HUB_SITE_ID.toUpperCase()}}`,
      url: 'https://Contoso.sharepoint.com/sites/Prosjektportalen/'
    })
    attachTelemetryPortal(portal, settingsMap('2'))
    await settle()
    trackUsage('ProjectStatusWebPart', 'loaded')
    flushTelemetry({ urgent: true })

    expect(bed.batches()[0].hubUrl).toBe(HUB_URL)
    expect(bed.batches()[0].usage).toEqual([
      { c: 'ProjectStatusWebPart', e: 'loaded', s: 'project', n: 1 }
    ])
  })

  it.each([
    ['a page of the hub', `${HUB_URL}/SitePages/Home.aspx`],
    ['a query', `${HUB_URL}?web=1`],
    ['a fragment', `${HUB_URL}#/prosjekter`],
    ['another host', 'https://fabrikam.sharepoint.com/sites/prosjektportalen'],
    ['http', HUB_URL.replace('https', 'http')],
    ['a host that only starts like ours', 'https://contoso.sharepoint.com.example.org/sites/pp'],
    ['a subsite', `${HUB_URL}/prosjekt-a`],
    ['nothing', undefined]
  ])('sends nothing when the anchor gives %s as its URL', async (_case, url) => {
    startTelemetry(hubPage())
    attachTelemetryPortal(hubPortal(settingsMap('2'), { url }), settingsMap('2'))
    await settle()
    trackUsage('Footer', 'page.viewed')
    bed.leave()
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it("accepts the tenant's root site as a hub", async () => {
    startTelemetry(hubPage())
    attachTelemetryPortal(
      hubPortal(settingsMap('2'), { url: 'https://contoso.sharepoint.com/' }),
      settingsMap('2')
    )
    await settle()
    trackUsage('Footer', 'page.viewed')
    bed.leave()
    expect(bed.batches()[0].hubUrl).toBe('https://contoso.sharepoint.com')
  })

  it('never lets a portal of another hub decide, or give the hub URL', async () => {
    startTelemetry(hubPage())
    const portfolio = hubPortal(settingsMap('3'), {
      hubSiteId: OTHER_HUB_SITE_ID,
      url: OTHER_HUB_URL
    })
    attachTelemetryPortal(portfolio, settingsMap('3'))
    attachTelemetryPortal(portfolio)
    await settle()
    trackUsage('PortfolioOverviewWebPart', 'loaded')
    bed.leave()

    expect(telemetryStore().anchor).toBeUndefined()
    expect(portfolio.getGlobalSettings).not.toHaveBeenCalled()
    expect(getTelemetryGate().level).toBe(0)
    expect(bed.fetch).not.toHaveBeenCalled()

    // The hub's own portal, attached after it, is the anchor.
    attachTelemetryPortal(hubPortal(), settingsMap('2'))
    await settle()
    bed.leave()
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].hubUrl).toBe(HUB_URL)
    expect(bed.batches()[0].level).toBe(2)
  })

  it.each([[''], [undefined], ['00000000-0000-0000-0000-000000000000'], ['not-a-guid']])(
    'accepts no portal on a page whose hub id is %j',
    async (hubSiteId) => {
      startTelemetry(hubPage({ hubSiteId, isHubPage: false }))
      attachTelemetryPortal(hubPortal(settingsMap('3'), { hubSiteId }), settingsMap('3'))
      attachTelemetryPortal(hubPortal(settingsMap('3')), settingsMap('3'))
      await settle()
      trackUsage('Footer', 'page.viewed')
      bed.leave()
      expect(telemetryStore().anchor).toBeUndefined()
      expect(bed.fetch).not.toHaveBeenCalled()
    }
  )

  it('lets a map from a later portal lower the decision, never raise it', async () => {
    startTelemetry(hubPage())
    const anchor = hubPortal(settingsMap('2'))
    attachTelemetryPortal(anchor, settingsMap('2'))
    expect(getTelemetryGate()).toEqual({ level: 2, catalog: true, reason: 'setting' })
    trackUsage('Footer', 'page.viewed')

    const higher = hubPortal(settingsMap('3'))
    attachTelemetryPortal(higher, settingsMap('3'))
    expect(getTelemetryGate().level).toBe(2)

    // The catalog's row missing from a later map: no catalog events, the level stays.
    attachTelemetryPortal(hubPortal(), settingsMap('2', false))
    expect(getTelemetryGate()).toEqual({ level: 2, catalog: false, reason: 'setting' })

    attachTelemetryPortal(hubPortal(), settingsMap('1'))
    expect(getTelemetryGate()).toEqual({ level: 1, catalog: false, reason: 'setting' })
    // What was counted above the new level is gone.
    expect(telemetryStore().usage).toEqual({})

    attachTelemetryPortal(higher, settingsMap('3'))
    attachTelemetryPortal(anchor, settingsMap('3'))
    expect(getTelemetryGate().level).toBe(1)

    attachTelemetryPortal(hubPortal(), settingsMap(undefined))
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'no-level' })

    // Only the anchor is ever read, and it was given its map.
    await settle()
    expect(higher.getGlobalSettings).not.toHaveBeenCalled()
    expect(anchor.getGlobalSettings).not.toHaveBeenCalled()
    expect(telemetryStore().anchor.portal).toBe(anchor)
  })

  it("keeps a lower map that comes before the anchor's own answer, and opens nothing by it", async () => {
    startTelemetry(hubPage())
    const anchor = hubPortal(settingsMap('3'))
    attachTelemetryPortal(anchor)
    attachTelemetryPortal(hubPortal(), settingsMap('2'))
    attachTelemetryPortal(hubPortal(), settingsMap('1'))
    attachTelemetryPortal(hubPortal(), settingsMap('3'))
    // A later map decides nothing by itself.
    expect(getTelemetryGate().reason).toBe('pending')

    await settle()
    expect(anchor.getGlobalSettings).toHaveBeenCalledTimes(1)
    expect(getTelemetryGate()).toEqual({ level: 1, catalog: false, reason: 'setting' })
  })

  it('shares one store between two copies of the module, as two bundles on a page do', async () => {
    type Copy = typeof import('./track') & typeof import('./flush')
    const load = (): Copy => {
      let copy: Copy
      jest.isolateModules(() => {
        copy = { ...jest.requireActual('./track'), ...jest.requireActual('./flush') }
      })
      return copy
    }
    const footer = load()
    const webPart = load()
    expect(footer.trackUsage).not.toBe(webPart.trackUsage)

    footer.startTelemetry(hubPage())
    webPart.startTelemetry(hubPage())
    webPart.attachTelemetryPortal(hubPortal(), settingsMap('2'))
    footer.attachTelemetryPortal(hubPortal(), settingsMap('2'))
    await settle()
    footer.trackUsage('Footer', 'page.viewed')
    webPart.trackUsage('PortfolioOverviewWebPart', 'loaded')
    footer.trackUsage('Footer', 'page.viewed')

    expect(webPart.getTelemetryGate().level).toBe(2)
    expect(footer.getTelemetryGate().level).toBe(2)
    // The listeners were installed once, by the copy that started first.
    const listened = (target: EventTarget, type: string): number =>
      (target.addEventListener as jest.Mock).mock.calls.filter(([name]) => name === type).length
    expect(listened(document, 'visibilitychange')).toBe(1)
    expect(listened(window, 'pagehide')).toBe(1)

    bed.leave()
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].usage).toEqual([
      { c: 'Footer', e: 'page.viewed', s: 'hub', n: 2 },
      { c: 'PortfolioOverviewWebPart', e: 'loaded', s: 'hub', n: 1 }
    ])
    // This file's own copy of the module sees the same store.
    expect(getTelemetryGate().level).toBe(2)
  })

  it('drops the decision and the anchor after a navigation to a page of another hub', async () => {
    await startOnHub('2')
    trackUsage('Footer', 'page.viewed')

    // The SPA navigation, as the Footer reports it.
    startTelemetry(hubPage({ siteId: OTHER_HUB_SITE_ID, hubSiteId: OTHER_HUB_SITE_ID }))
    // What the first hub's pages counted went out under that hub's decision.
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].hubUrl).toBe(HUB_URL)
    expect(telemetryStore().anchor).toBeUndefined()
    expect(telemetryStore().decision).toBeUndefined()
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'pending' })

    trackUsage('Footer', 'page.viewed')
    bed.leave()
    // The first hub's portal cannot decide for this page.
    attachTelemetryPortal(hubPortal(), settingsMap('3'))
    bed.leave()
    expect(bed.batches()).toHaveLength(1)

    const otherHub = hubPortal(settingsMap('2'), {
      hubSiteId: OTHER_HUB_SITE_ID,
      url: OTHER_HUB_URL
    })
    attachTelemetryPortal(otherHub, settingsMap('2'))
    await settle()
    bed.leave()
    expect(bed.batches()).toHaveLength(2)
    expect(bed.batches()[1]).toMatchObject({
      hubUrl: OTHER_HUB_URL,
      usage: [{ c: 'Footer', e: 'page.viewed', s: 'hub', n: 1 }]
    })
  })

  it("never sends what one hub's pages counted under another hub's decision", async () => {
    // No decision yet on the first hub: its setting may well be Off.
    startTelemetry(hubPage())
    const first = hubPortal(settingsMap('0'))
    first.getGlobalSettings.mockReturnValue(new Promise(() => undefined))
    attachTelemetryPortal(first)
    trackUsage('Footer', 'page.viewed')
    trackUsage('PortfolioOverviewWebPart', 'loaded')

    startTelemetry(hubPage({ siteId: OTHER_HUB_SITE_ID, hubSiteId: OTHER_HUB_SITE_ID }))
    const otherHub = hubPortal(settingsMap('2'), {
      hubSiteId: OTHER_HUB_SITE_ID,
      url: OTHER_HUB_URL
    })
    attachTelemetryPortal(otherHub, settingsMap('2'))
    await settle()
    trackUsage('Footer', 'help.opened')
    bed.leave()

    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].usage).toEqual([{ c: 'Footer', e: 'help.opened', s: 'hub', n: 1 }])
  })

  it('does not use a decision that was made for another hub than the page is on', async () => {
    await startOnHub('2')
    trackUsage('Footer', 'page.viewed')
    // Should the page and the decision ever disagree, the gate is closed.
    telemetryStore().page.hubSiteId = OTHER_HUB_SITE_ID
    expect(getTelemetryGate().level).toBe(0)
    bed.leave()
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('ignores an answer that arrives after the page has moved to another hub', async () => {
    startTelemetry(hubPage())
    let answer: (settings: Map<string, string>) => void
    const first = hubPortal()
    first.getGlobalSettings.mockReturnValue(new Promise((resolve) => (answer = resolve)))
    attachTelemetryPortal(first)
    startTelemetry(hubPage({ siteId: OTHER_HUB_SITE_ID, hubSiteId: OTHER_HUB_SITE_ID }))
    answer(settingsMap('3'))
    await settle()
    expect(telemetryStore().decision).toBeUndefined()
    expect(getTelemetryGate().level).toBe(0)
  })

  it('reads a decision older than an hour again, through the anchor, before it sends more', async () => {
    startTelemetry(hubPage())
    const anchor = hubPortal(settingsMap('2'))
    const later = hubPortal(settingsMap('3'))
    attachTelemetryPortal(anchor)
    attachTelemetryPortal(later)
    await settle()
    expect(anchor.getGlobalSettings).toHaveBeenCalledTimes(1)
    trackUsage('Footer', 'page.viewed')

    // An hour old to the millisecond is still good.
    bed.advance(GATE_MAX_AGE_MS)
    expect(getTelemetryGate().level).toBe(2)
    bed.advance(1)
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'pending' })
    bed.hide()
    flushTelemetry({ urgent: true })
    expect(bed.fetch).not.toHaveBeenCalled()
    // A flush reads nothing: it works from memory.
    expect(anchor.getGlobalSettings).toHaveBeenCalledTimes(1)

    // The tab comes back: the settings are read again, in the background.
    bed.show()
    bed.show()
    await settle()
    expect(anchor.getGlobalSettings).toHaveBeenCalledTimes(2)
    expect(later.getGlobalSettings).not.toHaveBeenCalled()
    expect(getTelemetryGate().level).toBe(2)
    flushTelemetry({ urgent: true })
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].usage).toEqual([{ c: 'Footer', e: 'page.viewed', s: 'hub', n: 1 }])
  })

  it('applies a level that was lowered when the old decision is read again', async () => {
    startTelemetry(hubPage())
    const anchor = hubPortal(settingsMap('3'))
    attachTelemetryPortal(anchor)
    await settle()
    trackUsage('Footer', 'page.viewed')
    trackError('Footer', 'render_failed')

    anchor.getGlobalSettings.mockResolvedValue(settingsMap('2'))
    bed.advance(GATE_MAX_AGE_MS + 1)
    // Counting something is enough to have the settings read again.
    trackUsage('Footer', 'page.viewed')
    await settle()
    expect(anchor.getGlobalSettings).toHaveBeenCalledTimes(2)
    expect(getTelemetryGate().level).toBe(2)
    expect(telemetryStore().errors).toEqual({})

    anchor.getGlobalSettings.mockResolvedValue(settingsMap('0'))
    bed.advance(GATE_MAX_AGE_MS + 1)
    startTelemetry(hubPage())
    await settle()
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'setting' })
    bed.leave()
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('applies a level that was raised: a call the old level drops has the settings read again', async () => {
    startTelemetry(hubPage())
    const anchor = hubPortal(settingsMap('0'))
    attachTelemetryPortal(anchor)
    await settle()
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'setting' })

    // The tab stays open and visible, and the level is raised on the hub.
    anchor.getGlobalSettings.mockResolvedValue(settingsMap('2'))
    bed.advance(GATE_MAX_AGE_MS + 1)
    trackUsage('Footer', 'page.viewed')
    expect(telemetryStore().usage).toEqual({})
    await settle()
    expect(anchor.getGlobalSettings).toHaveBeenCalledTimes(2)
    expect(getTelemetryGate().level).toBe(2)

    trackUsage('Footer', 'page.viewed')
    bed.leave()
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0]).toMatchObject({
      level: 2,
      usage: [{ c: 'Footer', e: 'page.viewed', s: 'hub', n: 1 }]
    })
  })

  it.each([
    ['an error', '1', (): void => trackError('Footer', 'render_failed')],
    ['a duration', '1', (): void => trackTiming('PortfolioOverviewWebPart', 'init', 120)],
    ['a heartbeat', '0', (): void => queueHeartbeat({ channel: 'main', hubLanguage: 'nb-NO' })],
    [
      'a site type resolver',
      '0',
      (): void => registerSiteTypeResolver(PROJECT_SITE_ID, () => Promise.resolve('project'))
    ]
  ])('reads an old decision again from %s the level drops', async (_call, level, call) => {
    startTelemetry(hubPage({ canManageHub: true }))
    const anchor = hubPortal(settingsMap(level))
    attachTelemetryPortal(anchor)
    await settle()

    // Nothing is read while the decision is good, however much is dropped.
    call()
    bed.advance(GATE_MAX_AGE_MS)
    call()
    await settle()
    expect(anchor.getGlobalSettings).toHaveBeenCalledTimes(1)

    anchor.getGlobalSettings.mockResolvedValue(settingsMap('3'))
    bed.advance(1)
    call()
    await settle()
    expect(anchor.getGlobalSettings).toHaveBeenCalledTimes(2)
    expect(getTelemetryGate().level).toBe(3)
  })
})
