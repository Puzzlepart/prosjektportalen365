import type { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import type {
  FieldCustomizerContext,
  FormCustomizerContext,
  ListViewCommandSetContext
} from '@microsoft/sp-listview-extensibility'
import type { WebPartContext } from '@microsoft/sp-webpart-base'
import { errorWithCause } from '../util/errorWithCause'
import { MAX_ENTRY_COUNT } from './contract'
import { attachTelemetryPortal, flushTelemetry, getTelemetryGate } from './flush'
import { hubLanguageFromLcid } from './heartbeat'
import {
  HOST,
  HUB_SITE_ID,
  HUB_URL,
  hubPage,
  hubPortal,
  ITelemetryTestBed,
  PROJECT_SITE_ID,
  PROJECT_URL,
  projectPage,
  settingsMap,
  settle,
  spfxTestContext,
  telemetryStore,
  telemetryTestBed,
  TENANT_ID
} from './__fixtures__/testFixtures'
import {
  ITelemetryInit,
  queueHeartbeat,
  registerSiteTypeResolver,
  requestHeartbeat,
  setSiteType,
  startTelemetry,
  telemetryInitFromContext,
  trackError,
  trackPageView,
  trackTiming,
  trackUsage
} from './track'

let bed: ITelemetryTestBed

beforeEach(() => {
  bed = telemetryTestBed()
})

afterEach(() => bed.restore())

/** Starts on a page with the hub's settings in hand, so the gate is decided at once. */
async function start(level: string, page = hubPage()): Promise<void> {
  startTelemetry(page)
  attachTelemetryPortal(hubPortal(), settingsMap(level))
  await settle()
}

/** Sends what is in memory and gives the one batch that made. */
function flushed() {
  bed.fetch.mockClear()
  flushTelemetry({ urgent: true })
  expect(bed.fetch.mock.calls.length).toBeLessThanOrEqual(1)
  return bed.batches()[0]
}

describe('startTelemetry', () => {
  it('does nothing before it is called: tracking needs a page', () => {
    trackUsage('Footer', 'page.viewed')
    trackError('Footer', 'render_failed')
    trackTiming('PortfolioOverviewWebPart', 'init', 10)
    queueHeartbeat({ channel: 'main', hubLanguage: 'nb-NO' })
    registerSiteTypeResolver(PROJECT_SITE_ID, () => Promise.resolve('project'))
    attachTelemetryPortal(hubPortal(), settingsMap('3'))
    flushTelemetry({ urgent: true })
    expect(telemetryStore()).toBeUndefined()
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'pending' })
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('keeps the page as normalised values, and only valid ones', () => {
    startTelemetry({
      host: 'Contoso.SharePoint.com',
      tenantId: `{${TENANT_ID.toUpperCase()}}`,
      siteId: `{${HUB_SITE_ID.toUpperCase()}}`,
      hubSiteId: HUB_SITE_ID.toUpperCase(),
      isHubPage: true,
      appVersion: '1.15.0.0',
      isDebug: false
    })
    expect(telemetryStore().page).toEqual({
      host: HOST,
      tenantId: TENANT_ID,
      siteId: HUB_SITE_ID,
      hubSiteId: HUB_SITE_ID,
      isHubPage: true,
      appVersion: '1.15.0',
      isDebug: false,
      canManageHub: false
    })
    expect(telemetryStore().siteTypes).toEqual({ [HUB_SITE_ID]: 'hub' })

    bed.restore()
    bed = telemetryTestBed()
    startTelemetry({
      host: 'contoso.sharepoint.com.example.org',
      tenantId: 'contoso.onmicrosoft.com',
      siteId: 'prosjekt-a',
      hubSiteId: undefined,
      isHubPage: true,
      appVersion: 'latest',
      isDebug: false
    })
    expect(telemetryStore().page).toMatchObject({
      host: '',
      tenantId: '',
      siteId: '',
      hubSiteId: '',
      appVersion: ''
    })
    expect(telemetryStore().siteTypes).toEqual({})
  })

  it('never throws, whatever it is given', () => {
    expect(() => startTelemetry(undefined)).not.toThrow()
    expect(() => startTelemetry({} as never)).not.toThrow()
    expect(() => attachTelemetryPortal(undefined)).not.toThrow()
    expect(() => attachTelemetryPortal({} as never, 'x' as never)).not.toThrow()
    const broken = hubPortal()
    Object.defineProperty(broken, 'hubSiteId', {
      get: () => {
        throw new Error('disposed')
      }
    })
    expect(() => attachTelemetryPortal(broken)).not.toThrow()
    expect(() => trackUsage(undefined, undefined)).not.toThrow()
    expect(() => trackError(undefined, undefined)).not.toThrow()
    expect(() => trackTiming(undefined, undefined, undefined)).not.toThrow()
    expect(() => queueHeartbeat(undefined)).not.toThrow()
    expect(() => requestHeartbeat(undefined)).not.toThrow()
    expect(() => registerSiteTypeResolver(undefined, undefined)).not.toThrow()
    expect(() => setSiteType(undefined, undefined)).not.toThrow()
    expect(() => trackPageView(undefined)).not.toThrow()
    expect(() => flushTelemetry()).not.toThrow()
  })

  it('never throws from a tracking call, even when the clock does', async () => {
    await start('3', hubPage({ canManageHub: true }))
    jest.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('no clock')
    })
    expect(() => {
      startTelemetry(hubPage())
      trackUsage('Footer', 'page.viewed')
      trackError('Footer', 'render_failed')
      trackTiming('PortfolioOverviewWebPart', 'init', 10)
      queueHeartbeat({ channel: 'main', hubLanguage: 'nb-NO' })
      requestHeartbeat('nb-NO')
      registerSiteTypeResolver(PROJECT_SITE_ID, () => Promise.resolve('project'))
      setSiteType(PROJECT_SITE_ID, 'project')
      trackPageView('Footer')
    }).not.toThrow()
  })

  it('sends nothing without a valid host or version, and leaves the tenant id out when it is no GUID', async () => {
    await start('2', hubPage({ tenantId: 'contoso.onmicrosoft.com' }))
    trackUsage('Footer', 'page.viewed')
    const batch = flushed()
    expect(batch.host).toBe(HOST)
    expect(batch).not.toHaveProperty('tenantId')

    for (const page of [hubPage({ host: 'intranet.contoso.com' }), hubPage({ appVersion: '' })]) {
      bed.restore()
      bed = telemetryTestBed()
      await start('2', page)
      trackUsage('Footer', 'page.viewed')
      expect(flushed()).toBeUndefined()
    }
  })

  it('builds its values from the context of an SPFx component', () => {
    const context = (hubSiteId: string, siteId = HUB_SITE_ID) => ({
      pageContext: {
        web: { absoluteUrl: 'https://Contoso.sharepoint.com/sites/prosjekt-a' },
        site: { id: { toString: () => siteId } },
        legacyPageContext: { aadTenantId: TENANT_ID, hubSiteId, siteId: `{${siteId}}` }
      },
      manifest: { version: '1.15.0' }
    })
    expect(telemetryInitFromContext(context(HUB_SITE_ID), { isDebug: false })).toEqual({
      host: 'contoso.sharepoint.com',
      tenantId: TENANT_ID,
      siteId: HUB_SITE_ID,
      hubSiteId: HUB_SITE_ID,
      isHubPage: true,
      appVersion: '1.15.0',
      isDebug: false
    })
    const project = telemetryInitFromContext(context(HUB_SITE_ID, PROJECT_SITE_ID), {
      isDebug: true,
      canManageHub: true
    })
    expect(project).toMatchObject({
      siteId: PROJECT_SITE_ID,
      isHubPage: false,
      isDebug: true,
      canManageHub: true
    })
    // A site outside every hub has an empty hub id, which is no hub page.
    expect(telemetryInitFromContext(context(''), { isDebug: false }).isHubPage).toBe(false)
    expect(telemetryInitFromContext(context(undefined), { isDebug: false }).isHubPage).toBe(false)
    const noUrl = context(HUB_SITE_ID)
    noUrl.pageContext.web.absoluteUrl = undefined
    expect(telemetryInitFromContext(noUrl, { isDebug: false }).host).toBe('')
  })

  it('takes the context of a web part and of every kind of extension: the compiler checks that each fits', () => {
    // Type imports only, erased when compiled: no test loads SPFx.
    type AnyContext =
      | WebPartContext
      | ApplicationCustomizerContext
      | ListViewCommandSetContext
      | FieldCustomizerContext
      | FormCustomizerContext
    const fromContext: (
      context: AnyContext,
      options: Pick<ITelemetryInit, 'isDebug' | 'canManageHub'>
    ) => ITelemetryInit = telemetryInitFromContext
    expect(fromContext).toBe(telemetryInitFromContext)
  })

  it("reads a page of the hub and of a project off the fixtures' context, for the tests of the solutions", () => {
    const hub = spfxTestContext()
    expect(telemetryInitFromContext(hub, { isDebug: false })).toEqual(hubPage())
    expect(hub.manifest.alias).toBe('Footer')
    // What the Footer reads beside them: the hub's language, and whether the user manages the web.
    expect(hubLanguageFromLcid(hub.pageContext.web.language)).toBe('nb-NO')
    expect(hub.pageContext.web.permissions.hasPermission()).toBe(false)
    expect(
      spfxTestContext({ canManageWeb: true }).pageContext.web.permissions.hasPermission()
    ).toBe(true)

    const project = spfxTestContext({ page: 'project', alias: 'RiskActionPlanner' })
    expect(telemetryInitFromContext(project, { isDebug: false })).toEqual(projectPage())
    expect(project.manifest.alias).toBe('RiskActionPlanner')
    expect(project.pageContext.site.absoluteUrl).toBe(PROJECT_URL)
  })

  it('never throws on a context it cannot read, and gives a page that nothing is sent from', async () => {
    // A bundle builds these values before `startTelemetry` can catch anything.
    const unreadable = [
      undefined,
      {},
      { pageContext: {}, manifest: { version: '1.15.0' } },
      { pageContext: { web: {}, site: {}, legacyPageContext: {} }, manifest: {} },
      // A site id that is no text, which `isHubSite` cannot search.
      {
        pageContext: {
          web: { absoluteUrl: HUB_URL },
          site: { id: HUB_SITE_ID },
          legacyPageContext: { hubSiteId: HUB_SITE_ID, siteId: 42 }
        },
        manifest: { version: '1.15.0' }
      }
    ]
    unreadable.forEach((context) => {
      expect(telemetryInitFromContext(context as never, { isDebug: true })).toEqual({
        host: '',
        siteId: '',
        isHubPage: false,
        appVersion: '',
        isDebug: true
      })
    })
    expect(() => telemetryInitFromContext(undefined, undefined)).not.toThrow()

    startTelemetry(telemetryInitFromContext({} as never, { isDebug: false }))
    attachTelemetryPortal(hubPortal(), settingsMap('3'))
    await settle()
    trackUsage('Footer', 'page.viewed')
    bed.leave()
    expect(telemetryStore().anchor).toBeUndefined()
    expect(telemetryStore().usage).toEqual({})
    expect(bed.fetch).not.toHaveBeenCalled()
  })
})

describe('trackUsage', () => {
  it('counts an event per component, variant and site, and sends the sums', async () => {
    await start('2')
    trackUsage('Footer', 'page.viewed')
    trackUsage('Footer', 'page.viewed')
    trackUsage('IdeaProcessing', 'idea.decided', 'approve')
    trackUsage('IdeaProcessing', 'idea.decided', 'reject')
    trackUsage('IdeaProcessing', 'idea.decided', 'approve')
    trackUsage('IdeaProcessing', 'idea.decided')
    expect(flushed().usage).toEqual([
      { c: 'Footer', e: 'page.viewed', s: 'hub', n: 2 },
      { c: 'IdeaProcessing', e: 'idea.decided', s: 'hub', n: 1 },
      { c: 'IdeaProcessing', e: 'idea.decided', s: 'hub', v: 'approve', n: 2 },
      { c: 'IdeaProcessing', e: 'idea.decided', s: 'hub', v: 'reject', n: 1 }
    ])
    // Sent once: the counters start over.
    expect(flushed()).toBeUndefined()
  })

  it('drops what the contract does not know', async () => {
    await start('2')
    trackUsage('ProjectUpgrade' as never, 'loaded')
    trackUsage('SharedLibrary' as never, 'loaded')
    trackUsage('Footer' as never, 'page.closed' as never)
    trackUsage('Footer' as never, 'constructor' as never)
    // Known values, in a combination the contract does not have. Such a call does not compile,
    // which the expected errors hold the signature to; where the types are cast away it is dropped.
    // @ts-expect-error -- `loaded` is a web part's event, and the Footer is an extension
    trackUsage('Footer', 'loaded')
    // @ts-expect-error -- `page.viewed` is the Footer's event, not a web part's
    trackUsage('ProjectStatusWebPart', 'page.viewed')
    // @ts-expect-error -- `dataSource.switched` belongs to the aggregation web parts
    trackUsage('PortfolioOverviewWebPart', 'dataSource.switched')
    trackUsage('Footer', 'page.viewed', 'new' as never)
    trackUsage('ProjectSetup', 'setup.completed', 'approve' as never)
    trackUsage('ProjectSetup', 'setup.completed', '' as never)
    expect(telemetryStore().usage).toEqual({})
    expect(flushed()).toBeUndefined()
  })

  it('stops counting at the highest count an entry may carry', async () => {
    await start('2')
    for (let count = 0; count < MAX_ENTRY_COUNT + 25; count++) trackUsage('Footer', 'page.viewed')
    expect(flushed().usage).toEqual([
      { c: 'Footer', e: 'page.viewed', s: 'hub', n: MAX_ENTRY_COUNT }
    ])
  })

  it('counts nothing on a page without a site id', async () => {
    await start('2', hubPage({ siteId: '' }))
    trackUsage('Footer', 'page.viewed')
    expect(telemetryStore().usage).toEqual({})
  })
})

describe('the levels', () => {
  it('level 1 sends the heartbeat and nothing else', async () => {
    await start('1', hubPage({ canManageHub: true }))
    trackUsage('Footer', 'page.viewed')
    trackError('Footer', 'render_failed')
    trackTiming('PortfolioOverviewWebPart', 'init', 400)
    expect(flushed()).toBeUndefined()

    queueHeartbeat({
      channel: 'main',
      templateVersion: '1.15.0',
      hubLanguage: 'nb-NO',
      projects: 3
    })
    const batch = flushed()
    expect(Object.keys(batch)).toEqual([
      'schema',
      'batchId',
      'host',
      'tenantId',
      'hubUrl',
      'level',
      'appVersion',
      'heartbeat'
    ])
    expect(batch.level).toBe(1)
    expect(batch.heartbeat).toEqual({
      channel: 'main',
      templateVersion: '1.15.0',
      hubLanguage: 'nb-NO',
      projects: 3,
      catalog: false
    })
    // No site hash is computed below level 2.
    expect(telemetryStore().siteHashes).toEqual({})
  })

  it('level 2 adds usage and sites, and still no errors or timings', async () => {
    await start('2')
    trackUsage('Footer', 'page.viewed')
    trackError('Footer', 'render_failed')
    trackTiming('PortfolioOverviewWebPart', 'init', 400)
    const batch = flushed()
    expect(batch.level).toBe(2)
    expect(batch.usage).toHaveLength(1)
    expect(batch.sites).toEqual([{ h: expect.stringMatching(/^[0-9a-f]{16}$/), s: 'hub' }])
    expect(batch).not.toHaveProperty('errors')
    expect(batch).not.toHaveProperty('timings')
    expect(batch).not.toHaveProperty('heartbeat')
  })

  it('level 3 adds error codes and durations in buckets', async () => {
    await start('3')
    trackError('ProjectStatusWebPart', Object.assign(new Error('[403] Forbidden'), { status: 403 }))
    trackError('ProjectStatusWebPart', { status: 403 })
    trackError('ProjectStatusWebPart', { status: 418, message: 'https://contoso.sharepoint.com' })
    trackError('Footer', 'render_failed')
    trackError('ProjectSetup', 'provisioning_failed')
    trackError('Footer', 'Kari Nordmann har ikke tilgang')
    trackError('Kari Nordmann' as never, 'render_failed')
    ;[0, 249, 250, 499, 500, 999, 1000, 1999, 2000, 3999, 4000, 7999, 8000, 600000].forEach((ms) =>
      trackTiming('PortfolioOverviewWebPart', 'init', ms)
    )
    ;[-1, NaN, Infinity, '12' as never, undefined].forEach((ms) =>
      trackTiming('PortfolioOverviewWebPart', 'init', ms)
    )
    trackTiming('PortfolioOverviewWebPart', 'firstRender' as never, 10)
    trackTiming('Unknown' as never, 'init', 10)

    const batch = flushed()
    expect(batch.level).toBe(3)
    expect(batch.errors).toEqual([
      { c: 'Footer', code: 'render_failed', n: 1 },
      { c: 'Footer', code: 'unknown', n: 1 },
      { c: 'ProjectSetup', code: 'provisioning_failed', n: 1 },
      { c: 'ProjectStatusWebPart', code: 'permission_denied', http: 403, n: 2 },
      { c: 'ProjectStatusWebPart', code: 'unknown', n: 1 }
    ])
    expect(batch.timings).toEqual([
      { c: 'PortfolioOverviewWebPart', m: 'init', h: [2, 2, 2, 2, 2, 2, 2] }
    ])
    expect(batch).not.toHaveProperty('usage')
    expect(batch).not.toHaveProperty('sites')
    // No text of an error leaves the tenant.
    const body = bed.fetch.mock.calls[0][1].body as string
    expect(body).not.toContain('Forbidden')
    expect(body).not.toContain('Kari')
  })

  it('counts a failure the user was shown a generic text for by the code of its cause', async () => {
    await start('3')
    trackError(
      'ProjectStatusWebPart',
      errorWithCause(
        'Kunne ikke hente statusrapportene.',
        Object.assign(new Error('[404] List Usikkerhet DP1 does not exist'), { status: 404 })
      )
    )
    const batch = flushed()
    expect(batch.errors).toEqual([
      { c: 'ProjectStatusWebPart', code: 'not_found', http: 404, n: 1 }
    ])
    // Neither the text the user saw nor the one SharePoint gave leaves the tenant.
    const body = bed.fetch.mock.calls[0][1].body as string
    expect(body).not.toContain('statusrapportene')
    expect(body).not.toContain('Usikkerhet')
  })
})

describe('queueHeartbeat', () => {
  const heartbeat = { channel: 'test', hubLanguage: 'en-US', projects: 12 } as const

  it('takes the heartbeat only on a hub page, from a user who manages the hub', async () => {
    await start('2', hubPage())
    queueHeartbeat(heartbeat)
    expect(telemetryStore().heartbeat).toBeUndefined()

    bed.restore()
    bed = telemetryTestBed()
    await start('2', projectPage({ canManageHub: true }))
    queueHeartbeat(heartbeat)
    expect(telemetryStore().heartbeat).toBeUndefined()

    bed.restore()
    bed = telemetryTestBed()
    // The Footer says who manages the hub; a web part that starts after it does not unsay it.
    startTelemetry(hubPage({ canManageHub: true }))
    await start('2', hubPage())
    queueHeartbeat(heartbeat)
    expect(flushed().heartbeat).toEqual({ ...heartbeat, catalog: true })
  })

  it('sends one heartbeat per page load', async () => {
    await start('1', hubPage({ canManageHub: true }))
    queueHeartbeat(heartbeat)
    queueHeartbeat({ ...heartbeat, projects: 13 })
    expect(flushed().heartbeat.projects).toBe(12)
    queueHeartbeat(heartbeat)
    expect(flushed()).toBeUndefined()
  })

  it('keeps only values of the contract', async () => {
    await start('2', hubPage({ canManageHub: true }))
    queueHeartbeat({
      channel: 'kunde-x',
      templateVersion: '1.15.0.a1b2c3d',
      hubLanguage: 'sv-SE',
      projects: 412.5,
      programs: -1,
      parentProjects: 100001,
      catalog: false,
      installUser: 'kari@contoso.com'
    } as never)
    expect(flushed().heartbeat).toEqual({
      channel: 'unknown',
      templateVersion: '1.15.0',
      hubLanguage: 'other',
      catalog: true
    })
  })

  it('is dropped at level 0', async () => {
    await start('0', hubPage({ canManageHub: true }))
    queueHeartbeat(heartbeat)
    expect(telemetryStore().heartbeat).toBeUndefined()
  })
})

describe('registerSiteTypeResolver', () => {
  it('is not called before the gate has resolved, nor below level 2', async () => {
    const resolver = jest.fn(() => Promise.resolve('project' as const))
    startTelemetry(projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, resolver)
    trackUsage('ProjectStatusWebPart', 'loaded')
    await settle()
    expect(resolver).not.toHaveBeenCalled()

    attachTelemetryPortal(hubPortal(), settingsMap('1'))
    await settle()
    expect(resolver).not.toHaveBeenCalled()
    expect(telemetryStore().siteHashes).toEqual({})
  })

  it('is called once per site when the gate opens at level 2, and the waiting counters go', async () => {
    const resolver = jest.fn(() => Promise.resolve('program' as const))
    startTelemetry(projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, resolver)
    registerSiteTypeResolver(`{${PROJECT_SITE_ID.toUpperCase()}}`, resolver)
    trackUsage('ProjectStatusWebPart', 'loaded')
    attachTelemetryPortal(hubPortal(), settingsMap('2'))
    // The site type is not known yet: the counter waits, and nothing untyped is sent.
    expect(flushed()).toBeUndefined()
    expect(Object.keys(telemetryStore().usage)).toHaveLength(1)

    await settle()
    trackUsage('ProjectStatusWebPart', 'loaded')
    registerSiteTypeResolver(PROJECT_SITE_ID, resolver)
    await settle()
    expect(resolver).toHaveBeenCalledTimes(1)
    const batch = flushed()
    expect(batch.usage).toEqual([{ c: 'ProjectStatusWebPart', e: 'loaded', s: 'program', n: 2 }])
    expect(batch.sites).toEqual([{ h: expect.stringMatching(/^[0-9a-f]{16}$/), s: 'program' }])
  })

  it('needs none on a hub page', async () => {
    const resolver = jest.fn(() => Promise.resolve('other' as const))
    await start('2')
    registerSiteTypeResolver(HUB_SITE_ID, resolver)
    trackUsage('Footer', 'page.viewed')
    await settle()
    expect(resolver).not.toHaveBeenCalled()
    expect(flushed().usage[0].s).toBe('hub')
  })

  it.each([
    ['fails', () => Promise.reject(new Error('[404] Not found'))],
    [
      'throws',
      () => {
        throw new Error('disposed')
      }
    ],
    ['answers something else', () => Promise.resolve('Prosjekt A')],
    ['answers hub', () => Promise.resolve('hub')]
  ])(
    'leaves the site without a type when the resolver %s, and asks no more',
    async (_how, answer) => {
      const resolver = jest.fn(answer)
      await start('2', projectPage())
      registerSiteTypeResolver(PROJECT_SITE_ID, resolver as never)
      trackUsage('ProjectStatusWebPart', 'loaded')
      await settle()
      registerSiteTypeResolver(PROJECT_SITE_ID, resolver as never)
      trackUsage('ProjectStatusWebPart', 'loaded')
      await settle()
      expect(resolver).toHaveBeenCalledTimes(1)
      expect(telemetryStore().siteTypes).toEqual({})
      expect(flushed()).toBeUndefined()
    }
  )

  it('counts each site of a session under its own type, and lists both sites', async () => {
    await start('2')
    trackUsage('PortfolioOverviewWebPart', 'loaded')
    startTelemetry(projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, () => Promise.resolve('parent'))
    trackUsage('ProjectStatusWebPart', 'loaded')
    await settle()
    const batch = flushed()
    expect(batch.hubUrl).toBe(HUB_URL)
    expect(batch.usage).toEqual([
      { c: 'PortfolioOverviewWebPart', e: 'loaded', s: 'hub', n: 1 },
      { c: 'ProjectStatusWebPart', e: 'loaded', s: 'parent', n: 1 }
    ])
    expect(batch.sites.map((site) => site.s).sort()).toEqual(['hub', 'parent'])
    expect(new Set(batch.sites.map((site) => site.h)).size).toBe(2)
  })

  it('sums the same event from two sites of one type into one entry', async () => {
    const second = `0${PROJECT_SITE_ID.substring(1)}`
    await start('2', projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, () => Promise.resolve('project'))
    trackUsage('ProjectStatusWebPart', 'loaded')
    startTelemetry(projectPage({ siteId: second }))
    registerSiteTypeResolver(second, () => Promise.resolve('project'))
    trackUsage('ProjectStatusWebPart', 'loaded')
    trackUsage('ProjectStatusWebPart', 'loaded')
    await settle()
    const batch = flushed()
    expect(batch.usage).toEqual([{ c: 'ProjectStatusWebPart', e: 'loaded', s: 'project', n: 3 }])
    expect(batch.sites).toHaveLength(2)
  })

  it('leaves a site out of sites while it has no hash, and still sends its usage', async () => {
    bed.removeSubtleCrypto()
    await start('2')
    trackUsage('Footer', 'page.viewed')
    const batch = flushed()
    expect(batch.usage).toHaveLength(1)
    expect(batch).not.toHaveProperty('sites')
  })

  it('computes the hash again when the month has turned in a tab left open', async () => {
    await start('2')
    trackUsage('Footer', 'page.viewed')
    const november = flushed().sites[0].h

    // Into December, with a decision that is read again on the way.
    bed.advance(20 * 24 * 60 * 60 * 1000)
    trackUsage('Footer', 'page.viewed')
    await settle()
    // The hash in memory is November's: the site is left out until December's is computed.
    expect(flushed()).not.toHaveProperty('sites')
    trackUsage('Footer', 'page.viewed')
    await settle()
    const december = flushed().sites[0].h
    expect(december).toMatch(/^[0-9a-f]{16}$/)
    expect(december).not.toBe(november)
  })
})

describe('setSiteType', () => {
  it('gives the site its type at once, so what is counted on it goes in the next flush', async () => {
    await start('2', projectPage())
    trackUsage('ProjectSetup', 'setup.completed', 'new')
    expect(flushed()).toBeUndefined()

    setSiteType(`{${PROJECT_SITE_ID.toUpperCase()}}`, 'program')
    expect(telemetryStore().siteTypes).toEqual({ [PROJECT_SITE_ID]: 'program' })
    expect(flushed().usage).toEqual([
      { c: 'ProjectSetup', e: 'setup.completed', s: 'program', v: 'new', n: 1 }
    ])
  })

  it('replaces what a resolver answered before the setup changed the site', async () => {
    const resolver = jest.fn(() => Promise.resolve('project' as const))
    await start('2', projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, resolver)
    trackUsage('ProjectStatusWebPart', 'loaded')
    await settle()
    expect(telemetryStore().siteTypes[PROJECT_SITE_ID]).toBe('project')

    // The site is made a parent project: the template says what it is now.
    setSiteType(PROJECT_SITE_ID, 'parent')
    trackUsage('ProjectSetup', 'setup.completed', 'parent')
    expect(flushed().usage).toEqual([
      { c: 'ProjectSetup', e: 'setup.completed', s: 'parent', v: 'parent', n: 1 },
      { c: 'ProjectStatusWebPart', e: 'loaded', s: 'parent', n: 1 }
    ])
    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('stands when a resolver that was already asked answers after it', async () => {
    let answer: (siteType: 'project') => void
    const resolver = jest.fn(() => new Promise<'project'>((resolve) => (answer = resolve)))
    await start('2', projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, resolver)
    await settle()
    expect(resolver).toHaveBeenCalledTimes(1)

    setSiteType(PROJECT_SITE_ID, 'program')
    answer('project')
    await settle()
    expect(telemetryStore().siteTypes[PROJECT_SITE_ID]).toBe('program')
  })

  it('leaves a resolver that is registered and not yet asked unasked', async () => {
    const resolver = jest.fn(() => Promise.resolve('project' as const))
    startTelemetry(projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, resolver)
    setSiteType(PROJECT_SITE_ID, 'parent')
    attachTelemetryPortal(hubPortal(), settingsMap('2'))
    registerSiteTypeResolver(PROJECT_SITE_ID, resolver)
    trackUsage('ProjectStatusWebPart', 'loaded')
    await settle()
    expect(resolver).not.toHaveBeenCalled()
    expect(flushed().usage[0].s).toBe('parent')
  })

  it('keeps a hub a hub, and takes only the site types a site other than the hub can have', async () => {
    await start('2')
    setSiteType(HUB_SITE_ID, 'project')
    expect(telemetryStore().siteTypes).toEqual({ [HUB_SITE_ID]: 'hub' })

    setSiteType(PROJECT_SITE_ID, 'hub' as never)
    setSiteType(PROJECT_SITE_ID, 'Prosjekt A' as never)
    setSiteType(PROJECT_SITE_ID, undefined)
    setSiteType('prosjekt-a', 'project')
    setSiteType(undefined, 'project')
    expect(telemetryStore().siteTypes).toEqual({ [HUB_SITE_ID]: 'hub' })
  })

  it('does nothing before telemetry is started', () => {
    setSiteType(PROJECT_SITE_ID, 'project')
    expect(telemetryStore()).toBeUndefined()
  })
})
