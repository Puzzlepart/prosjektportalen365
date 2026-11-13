// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter hands out the test's portal data service, and
// the footer component (tested on its own) records the props the customizer renders it with, the
// alias its components would count for in usage statistics, and how many footers are mounted (in
// a layout effect, which runs as react-dom's `render` returns).
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  portalDataService: undefined as any,
  checkProjectAdminPermissions: jest.fn(() => Promise.resolve(true))
}
jest.mock('../../data/SPDataAdapter', () => ({ __esModule: true, default: adapter }))
const rendered: { props?: any; alias?: string; mounted: number } = { mounted: 0 }
jest.mock('components/Footer', () => ({
  Footer: (props: any) => {
    const { useContext, useLayoutEffect } = jest.requireActual('react')
    const { TelemetryContext } = jest.requireActual('pp365-shared-library/lib/telemetry')
    rendered.props = props
    rendered.alias = useContext(TelemetryContext)
    useLayoutEffect(() => {
      rendered.mounted++
      return () => {
        rendered.mounted--
      }
    }, [])
    return null
  }
}))

import { PlaceholderName } from '@microsoft/sp-application-base'
import { act } from '@testing-library/react'
import { ProjectAdminPermission } from 'pp365-shared-library'
import {
  countedTelemetry,
  HUB_SITE_ID,
  hubPortal,
  ITelemetryTestBed,
  PROJECT_SITE_ID,
  settle,
  spfxTestContext,
  telemetryStore,
  telemetryTestBed
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import resource from 'SharedResources'
import FooterApplicationCustomizer from '.'
import { manifestAlias } from '../testFixtures'
import { HelpContentModel, InstallationEntry } from './types'
import { PLACEHOLDER_TRACE_KEY, PLACEHOLDER_TRACE_PREFIX } from './placeholderTrace'

const HUB = 'https://contoso.sharepoint.com/sites/pp365'
const PROJECT = 'https://contoso.sharepoint.com/sites/frisbee'
const INSTALL = {
  InstallEndTime: '2026-09-30T10:00:00Z',
  InstallVersion: '1.15.0.a1b2c3d',
  InstallChannel: 'test'
}

/** Answers a read with `data`, or rejects it with `error` when the test gave one. */
const answer = <T>(data: T, error?: unknown): Promise<T> =>
  error ? Promise.reject(error) : Promise.resolve(data)

/**
 * A portal data service stand-in with the lists and calls the customizer reads. A read named in
 * `failing` rejects with that error.
 */
function portalDataService({
  isAvailable = true,
  settings = { ShowFooter: '1' } as Record<string, string>,
  links = [] as any[],
  assistantGroup = [] as any[],
  hubProjects = [] as any[],
  project = null as any,
  helpItems = [] as any[],
  deniedLists = [] as string[],
  failing = {} as { installationLog?: any; links?: any; projects?: any; helpContent?: any }
} = {}) {
  const lists = {
    [resource.Lists_InstallationLog_Title]: {
      items: { orderBy: () => ({ top: () => () => answer([INSTALL], failing.installationLog) }) }
    },
    [resource.Lists_Links_Title]: { items: () => answer(links, failing.links) },
    [resource.Lists_Projects_Title]: {
      items: { select: () => ({ top: () => () => answer(hubProjects, failing.projects) }) }
    }
  }
  const requests: { helpContent?: any } = {}
  return {
    isAvailable,
    url: HUB,
    getGlobalSettings: () => Promise.resolve(new Map(Object.entries(settings))),
    web: {
      lists: { getByTitle: (title: string) => lists[title] },
      siteGroups: { select: () => ({ filter: () => () => Promise.resolve(assistantGroup) }) }
    },
    getProjectDetails: () => Promise.resolve(project),
    isListAvailable: (list: string) => isAvailable && !deniedLists.includes(list),
    getItems: (_list: string, model: any, query: any) => {
      requests.helpContent = query
      return answer(
        helpItems.map((item) => new model(item, undefined)),
        failing.helpContent
      )
    },
    requests
  }
}

/**
 * The customizer on the hub (or a project site), initialised with `portal`. The placeholder's
 * element is in the document only when `attached`. With `telemetry` the context is a page as
 * usage statistics read it, for a user who may manage the web or may not.
 */
async function footerCustomizer(
  portal = portalDataService(),
  {
    onHub = true,
    attached = false,
    telemetry = undefined as { canManageWeb?: boolean } | undefined
  } = {}
) {
  adapter.portalDataService = portal
  const navigated: (() => Promise<void>)[] = []
  // Each subscription as it was added: the observer and the handler, unbound.
  const subscriptions: [unknown, () => unknown][] = []
  const placeholder = { domElement: document.createElement('div'), dispose: jest.fn() }
  if (attached) document.body.appendChild(placeholder.domElement)
  const page = telemetry
    ? spfxTestContext({ page: onHub ? 'hub' : 'project', ...telemetry })
    : undefined
  const context = {
    ...page,
    pageContext: {
      web: { absoluteUrl: onHub ? HUB : PROJECT },
      ...page?.pageContext,
      legacyPageContext: {
        siteId: onHub ? '{hub-1}' : '{site-2}',
        hubSiteId: 'hub-1',
        ...page?.pageContext.legacyPageContext,
        isSiteAdmin: true
      }
    },
    application: {
      navigatedEvent: {
        add: (observer: any, handler: () => Promise<void>) => {
          subscriptions.push([observer, handler])
          navigated.push(handler.bind(observer))
        },
        remove: jest.fn()
      }
    },
    placeholderProvider: {
      placeholderNames: [PlaceholderName.Top, PlaceholderName.Bottom],
      tryCreateContent: jest.fn(() => placeholder),
      changedEvent: { add: jest.fn() }
    }
  }
  const customizer = new FooterApplicationCustomizer()
  ;(customizer as any).context = context
  ;(customizer as any).properties = { publicMediaBasePath: 'https://media.example/media' }
  // Through `act` too: the customizer renders the footer as it starts, and outside `act` React
  // 18 would render it after the test, into the next one.
  await act(async () => {
    await customizer.onInit()
  })
  // Through `act`: React 18's `createRoot` renders the footer after the handler returns.
  const navigate = async () => {
    await act(async () => {
      for (const handler of navigated) await handler()
    })
  }
  return { context, placeholder, navigate, customizer, subscriptions }
}

/** Answers `fetch` with `body` (as JSON or text), or with a failed response. */
function respond(body: unknown, ok = true) {
  return jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(body)
    })
  )
}

const originalFetch = global.fetch

beforeEach(() => {
  rendered.props = undefined
  rendered.alias = undefined
  rendered.mounted = 0
  adapter.checkProjectAdminPermissions.mockImplementation(() => Promise.resolve(true))
})

afterEach(() => {
  global.fetch = originalFetch
  window.history.replaceState({}, '', '/')
})

describe('FooterApplicationCustomizer', () => {
  it('renders the footer at the bottom of every page it navigates to, once', async () => {
    const { context, placeholder, navigate } = await footerCustomizer(
      portalDataService({ settings: { ShowFooter: '1', MinimizeFooter: '1' } })
    )
    await navigate()
    expect(context.placeholderProvider.tryCreateContent).toHaveBeenCalledWith(
      PlaceholderName.Bottom,
      expect.anything()
    )
    expect(rendered.props).toMatchObject({
      portalUrl: HUB,
      showFooter: true,
      minimizeFooter: true,
      useAssistant: false,
      hasAssistantAccess: false
    })
    expect(rendered.props.installEntries.map((entry) => entry.fullInstallVersion)).toEqual([
      '1.15.0.a1b2c3d'
    ])
    await navigate()
    expect(placeholder.domElement.childNodes).toHaveLength(1)
    expect(context.placeholderProvider.tryCreateContent).toHaveBeenCalledTimes(1)
  })

  it('renders as soon as it has started, without waiting for a navigation', async () => {
    // It rendered on SharePoint's navigated event only, which it subscribed to after its own
    // fetches: on a list page that event had come and gone, and the footer never showed.
    await footerCustomizer(portalDataService({ settings: { ShowFooter: '1' } }))
    expect(rendered.props).toMatchObject({ portalUrl: HUB, showFooter: true })
  })

  it('renders once SharePoint has its placeholders, which on a list page it can define after the footer has started', async () => {
    // With no placeholder at the start it waited for a navigation, which on a list page never
    // came: the footer showed on few loads there (2026-10-20).
    const placeholder = { domElement: document.createElement('div'), dispose: jest.fn() }
    let available = false
    const placeholdersChanged: Array<() => void> = []
    const placeholderProvider = {
      tryCreateContent: jest.fn(() => (available ? placeholder : undefined)),
      changedEvent: {
        add: jest.fn((observer: any, handler: () => void) =>
          placeholdersChanged.push(handler.bind(observer))
        )
      }
    }
    adapter.portalDataService = portalDataService({ settings: { ShowFooter: '1' } })
    const customizer = new FooterApplicationCustomizer()
    ;(customizer as any).context = {
      pageContext: {
        web: { absoluteUrl: HUB },
        legacyPageContext: { siteId: '{hub-1}', hubSiteId: 'hub-1', isSiteAdmin: true }
      },
      application: { navigatedEvent: { add: jest.fn() } },
      placeholderProvider
    }
    ;(customizer as any).properties = {}
    await act(async () => {
      await expect(customizer.onInit()).resolves.toBeUndefined()
    })
    expect(placeholderProvider.tryCreateContent).toHaveBeenCalled()
    expect(rendered.props).toBeUndefined()
    available = true
    await act(async () => {
      for (const changed of placeholdersChanged) changed()
    })
    expect(rendered.props).toMatchObject({ portalUrl: HUB, showFooter: true })
    expect(placeholder.domElement.childNodes).toHaveLength(1)
  })

  it('traces the placeholders from the first line of onInit when asked to, and whether the content it was given is in the page (sp-dev-docs#11070)', async () => {
    window.sessionStorage.setItem(PLACEHOLDER_TRACE_KEY, '1')
    const info = jest.spyOn(console, 'info').mockImplementation(() => undefined)
    const lines = () =>
      info.mock.calls
        .filter(([prefix]) => prefix === PLACEHOLDER_TRACE_PREFIX)
        .map(([, json]) => JSON.parse(json))
    try {
      // Content outside the document, as SharePoint hands out on a list page whose placeholders
      // it never defined.
      await footerCustomizer()
      expect(lines()).toEqual([
        expect.objectContaining({ step: 'onInit', placeholderNames: ['Top', 'Bottom'] }),
        expect.objectContaining({ step: 'setUp' }),
        expect.objectContaining({ step: 'tryCreateContent', acquired: true, connected: false })
      ])
      info.mockClear()
      const { placeholder } = await footerCustomizer(undefined, { attached: true })
      expect(lines()).toContainEqual(
        expect.objectContaining({ step: 'tryCreateContent', acquired: true, connected: true })
      )
      placeholder.domElement.remove()
    } finally {
      info.mockRestore()
      window.sessionStorage.removeItem(PLACEHOLDER_TRACE_KEY)
    }
  })

  it('keeps one footer mounted across navigations, and unmounts it with its placeholder', async () => {
    const { context, placeholder, navigate } = await footerCustomizer()
    await navigate()
    await navigate()
    await navigate()
    expect(rendered.mounted).toBe(1)
    // SharePoint calls `onDispose` when it removes the placeholder, and the next page makes a new one.
    const [, options] = (context.placeholderProvider.tryCreateContent as jest.Mock).mock.calls[0]
    act(() => {
      options.onDispose(placeholder)
    })
    expect(rendered.mounted).toBe(0)
    await navigate()
    expect(context.placeholderProvider.tryCreateContent).toHaveBeenCalledTimes(2)
    expect(rendered.mounted).toBe(1)
    expect(placeholder.domElement.childNodes).toHaveLength(1)
  })

  it('tells the footer which page it is on, which a navigation changes while it stays mounted', async () => {
    window.history.replaceState({}, '', '/sites/pp365/SitePages/Home.aspx')
    const { navigate } = await footerCustomizer()
    expect(rendered.props.pagePath).toBe('/sites/pp365/SitePages/Home.aspx')
    window.history.pushState({}, '', '/sites/pp365/SitePages/Portef%C3%B8ljeoversikt.aspx')
    await navigate()
    expect(rendered.props.pagePath).toBe('/sites/pp365/SitePages/Portef%C3%B8ljeoversikt.aspx')
    expect(rendered.mounted).toBe(1)
  })

  it.each([
    ['the hub is out of reach', portalDataService({ isAvailable: false })],
    ['the footer is turned off', portalDataService({ settings: {} })]
  ])('stays away when %s', async (_, portal) => {
    const { navigate } = await footerCustomizer(portal)
    await navigate()
    expect(rendered.props).toBeUndefined()
  })

  it('uses the beta channel of the assistant when it has one', async () => {
    const settings = {
      ShowFooter: '1',
      UseAssistant: '1',
      UseBetaChannel: '1',
      EndpointUrl: 'https://assistent.example',
      BetaEndpointUrl: 'https://beta.assistent.example'
    }
    let footer = await footerCustomizer(portalDataService({ settings }))
    await footer.navigate()
    expect(rendered.props).toMatchObject({
      useAssistant: true,
      hasAssistantAccess: true,
      assistantEndpointUrl: 'https://beta.assistent.example'
    })

    footer = await footerCustomizer(
      portalDataService({ settings: { ...settings, BetaEndpointUrl: '' } })
    )
    await footer.navigate()
    expect(rendered.props.assistantEndpointUrl).toBe('https://assistent.example')
  })

  it.each([
    ['group', 'the hub', true, false, true, true],
    ['group', 'the hub', true, false, false, false],
    ['role', 'a project', false, true, false, true],
    ['role', 'a project', false, false, true, false],
    ['role', 'the hub', true, false, true, true],
    ['both', 'a project', false, true, true, true],
    ['both', 'a project', false, true, false, false]
  ])(
    'checks access to the assistant by %s on %s',
    async (mode, _, onHub, hasRole, inGroup, access) => {
      adapter.checkProjectAdminPermissions.mockImplementation(() => Promise.resolve(hasRole))
      const portal = portalDataService({
        settings: {
          ShowFooter: '1',
          UseAssistant: '1',
          RequireAssistantAccess: '1',
          AssistantAccessMode: mode
        },
        assistantGroup: [{ Title: 'Assistentbrukere', CanCurrentUserViewMembership: inGroup }]
      })
      const { navigate } = await footerCustomizer(portal, { onHub })
      await navigate()
      expect(Boolean(rendered.props.hasAssistantAccess)).toBe(access)
      if (mode === 'role' && !onHub) {
        expect(adapter.checkProjectAdminPermissions).toHaveBeenCalledWith(
          ProjectAdminPermission.AssistantAccess
        )
      }
    }
  )

  it('loads the links of the hub', async () => {
    const links = [
      { GtLinkUrl: { Url: 'https://alfa.example', Description: 'Alfa' }, GtLinkLevel: 'Alle' }
    ]
    const { navigate } = await footerCustomizer(portalDataService({ links }))
    await navigate()
    expect(await rendered.props.loadLinks()).toEqual([
      { Url: 'https://alfa.example', Description: 'Alfa', Level: 'Alle' }
    ])
  })

  it('loads the releases from GitHub, and none when GitHub does not give them', async () => {
    const { navigate } = await footerCustomizer()
    await navigate()
    global.fetch = respond([{ tag_name: 'v1.15.2' }]) as any
    expect(await rendered.props.loadGitHubReleases()).toEqual([{ tag_name: 'v1.15.2' }])
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/puzzlepart/prosjektportalen365/releases'
    )
    global.fetch = respond({ message: 'API rate limit exceeded' }) as any
    expect(await rendered.props.loadGitHubReleases()).toEqual([])
    global.fetch = respond([], false) as any
    expect(await rendered.props.loadGitHubReleases()).toEqual([])
    global.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch'))) as any
    expect(await rendered.props.loadGitHubReleases()).toEqual([])
  })

  it('lists the followed sites that are projects of this hub as favorites', async () => {
    const hubProjects = [{ GtSiteUrl: 'https://contoso.sharepoint.com/sites/Frisbee' }, {}]
    const { navigate } = await footerCustomizer(portalDataService({ hubProjects }))
    await navigate()
    global.fetch = respond({
      d: {
        Followed: {
          results: [
            { Name: 'Frisbee', Uri: PROJECT },
            { Name: 'Intranett', Uri: 'https://contoso.sharepoint.com/sites/intranett' },
            { Name: '', Url: PROJECT }
          ]
        }
      }
    }) as any
    expect(await rendered.props.loadFavoriteProjects()).toEqual([{ name: 'Frisbee', url: PROJECT }])
    expect(global.fetch).toHaveBeenCalledWith(`${HUB}/_api/social.following/my/followed(types=4)`, {
      headers: { Accept: 'application/json;odata=verbose' }
    })
    global.fetch = respond({}, false) as any
    expect(await rendered.props.loadFavoriteProjects()).toEqual([])
  })

  it.each([
    ['the portfolio', null, resource.Lists_HelpContent_Level_Portfolio],
    ['a project', { isParentProject: false }, resource.Lists_HelpContent_Level_Project],
    ['a program', { isParentProject: true }, resource.Lists_HelpContent_Level_ParentProgram]
  ])(
    'loads the help for the page at the level of %s, three entries at most',
    async (_, project, level) => {
      window.history.replaceState({}, '', '/sites/pp365/SitePages/Hjem.aspx')
      const helpItems = ['En', 'To', 'Tre', 'Fire']
        .map((Title) => ({ Title, GtURL: 'SitePages/Hjem' }))
        .concat({ Title: 'Annen side', GtURL: 'SitePages/Annet' })
      const portal = portalDataService({ project, helpItems })
      const { navigate } = await footerCustomizer(portal)
      await navigate()
      const help = await rendered.props.loadHelpContent()
      expect(help.map(({ title }) => title)).toEqual(['En', 'To', 'Tre'])
      expect(portal.requests.helpContent.ViewXml).toContain(
        `<Value Type="MultiChoice">${level}</Value>`
      )
    }
  )

  it('loads the help at the level of a project on a project site whose project it may not read', async () => {
    // A member of «Minimum lesetilganger på hub» is refused `Prosjekter`, and got the hub's help.
    window.history.replaceState({}, '', '/sites/frisbee/SitePages/ProjectHome.aspx')
    const portal = portalDataService({ deniedLists: ['PROJECTS'] })
    const { navigate } = await footerCustomizer(portal, { onHub: false })
    await navigate()
    await rendered.props.loadHelpContent()
    expect(portal.requests.helpContent.ViewXml).toContain(
      `<Value Type="MultiChoice">${resource.Lists_HelpContent_Level_Project}</Value>`
    )
  })

  // Client-side navigation to a site, by the hub's title for one, leaves the address without the
  // front page the help rows name, and the help was unavailable there.
  it.each([
    {
      site: 'the hub',
      onHub: true,
      project: null,
      frontPage: 'SitePages/Home.aspx',
      address: '/sites/pp365'
    },
    {
      site: 'a project',
      onHub: false,
      project: { isParentProject: false },
      frontPage: 'SitePages/ProjectHome.aspx',
      address: '/sites/frisbee/'
    }
  ])(
    "loads the front page's help on the address of $site",
    async ({ onHub, project, frontPage, address }) => {
      window.history.replaceState({}, '', address)
      const helpItems = [
        { Title: 'Forsiden', GtURL: frontPage },
        { Title: 'Annen side', GtURL: 'SitePages/Annet.aspx' }
      ]
      const portal = portalDataService({ project, helpItems })
      const { navigate } = await footerCustomizer(portal, { onHub })
      await navigate()
      const help = await rendered.props.loadHelpContent()
      expect(help.map(({ title }) => title)).toEqual(['Forsiden'])
    }
  )
})

/**
 * What the footer does for usage statistics: it starts them on every page of a hub it can reach,
 * whether or not it shows; counts each page once; sends the hub's heartbeat for a user who may
 * manage the hub; and counts the reads it fails. The window's `fetch` is the test bed's, and
 * records the batches that are sent.
 */
describe('FooterApplicationCustomizer, usage statistics', () => {
  const ALIAS = manifestAlias('footer')
  const PAGE_VIEW = `${ALIAS} page.viewed`
  let bed: ITelemetryTestBed

  /**
   * The hub as usage statistics read it: the footer's stand-in with the hub's id and URL, its
   * installation facts and what kind of site a site is, from the telemetry fixtures. The footer
   * shows and the catalog row is `1` unless `settings` say otherwise.
   */
  function hubWith(
    settings: Record<string, string>,
    options: Parameters<typeof portalDataService>[0] = {}
  ) {
    const { hubSiteId, url, getUsageSnapshot, getSiteKind } = hubPortal()
    const portal = portalDataService({
      settings: { ShowFooter: '1', CatalogTelemetryEnabled: '1', ...settings },
      ...options
    })
    return { ...portal, hubSiteId, url, getUsageSnapshot, getSiteKind }
  }

  /** The usage entries sent so far. */
  const usageSent = () => bed.batches().flatMap((batch) => batch.usage ?? [])

  beforeEach(() => {
    bed = telemetryTestBed()
  })

  afterEach(() => bed.restore())

  it.each([
    ['hidden', '0'],
    ['showing', '1']
  ])(
    'counts the page with the footer %s, once per page, and again on each page it navigates to',
    async (_, ShowFooter) => {
      const { navigate } = await footerCustomizer(
        hubWith({ ShowFooter, UsageStatisticsLevel: '2' }),
        { telemetry: {} }
      )
      expect(Boolean(rendered.props)).toBe(ShowFooter === '1')
      // A footer that shows is rendered under its alias, so its components count for it.
      expect(rendered.alias).toBe(ShowFooter === '1' ? ALIAS : undefined)
      expect(countedTelemetry().usage).toEqual({ [PAGE_VIEW]: 1 })
      // SharePoint's navigation event for the page it is already on counts nothing more.
      await navigate()
      expect(countedTelemetry().usage).toEqual({ [PAGE_VIEW]: 1 })
      bed.navigate('/sites/prosjektportalen/SitePages/Prosjekter.aspx')
      await navigate()
      expect(countedTelemetry().usage).toEqual({ [PAGE_VIEW]: 2 })
    }
  )

  it.each([
    ['hidden', '0', 1],
    ['showing', '1', 2]
  ])(
    'follows the navigation with one subscription of its own with the footer %s, and removes it when it is disposed',
    async (_, ShowFooter, count) => {
      const { customizer, subscriptions, context } = await footerCustomizer(
        hubWith({ ShowFooter, UsageStatisticsLevel: '2' }),
        { telemetry: {} }
      )
      // Its own, and the footer's when it shows: no handler is added twice.
      expect(subscriptions).toHaveLength(count)
      expect(new Set(subscriptions.map(([, handler]) => handler)).size).toBe(count)
      const [observer, handler] = subscriptions[0]
      expect(observer).toBe(customizer)
      ;(customizer as any).onDispose()
      expect(context.application.navigatedEvent.remove).toHaveBeenCalledTimes(1)
      expect(context.application.navigatedEvent.remove).toHaveBeenCalledWith(customizer, handler)
    }
  )

  it.each([
    ['for a user who may manage the hub, on the hub', true, true, 1],
    ['not for a user who may not manage the hub', true, false, 0],
    ['not on a project, for a user who may manage the project', false, true, 0]
  ])("sends the hub's heartbeat %s", async (_, onHub, canManageWeb, heartbeats) => {
    const portal = hubWith({ UsageStatisticsLevel: '2' })
    const { navigate } = await footerCustomizer(portal, { onHub, telemetry: { canManageWeb } })
    await settle()
    // Once per page load: a navigation asks for no other.
    bed.navigate('/sites/prosjektportalen/SitePages/Prosjekter.aspx')
    await navigate()
    await settle()
    bed.leave()
    expect(bed.batches().filter((batch) => batch.heartbeat)).toHaveLength(heartbeats)
    expect(portal.getUsageSnapshot).toHaveBeenCalledTimes(heartbeats)
  })

  it("sends the heartbeat at once, with the hub's facts and language, and alone at Grunnleggende", async () => {
    await footerCustomizer(hubWith({ UsageStatisticsLevel: '1' }), {
      telemetry: { canManageWeb: true }
    })
    await settle()
    expect(bed.batches()).toEqual([
      expect.objectContaining({
        level: 1,
        heartbeat: {
          channel: 'main',
          templateVersion: '1.15.0',
          hubLanguage: 'nb-NO',
          projects: 12,
          programs: 2,
          parentProjects: 3,
          catalog: false
        }
      })
    ])
    // No page view at this level, and no site.
    expect(bed.batches()[0]).not.toHaveProperty('usage')
    expect(bed.batches()[0]).not.toHaveProperty('sites')
  })

  it.each([
    ['usage statistics are off', { UsageStatisticsLevel: '0' }],
    ['the hub has no level row', {}],
    ['the catalog row is 0', { UsageStatisticsLevel: '3', CatalogTelemetryEnabled: '0' }]
  ])('counts nothing and sends nothing when %s', async (_, settings) => {
    const portal = hubWith(settings)
    const { navigate } = await footerCustomizer(portal, { telemetry: { canManageWeb: true } })
    await settle()
    await navigate()
    bed.leave()
    expect(countedTelemetry().usage).toEqual({})
    expect(portal.getUsageSnapshot).not.toHaveBeenCalled()
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('starts nothing and sends nothing when the hub is out of reach', async () => {
    const portal = hubWith({ UsageStatisticsLevel: '3' }, { isAvailable: false })
    const { navigate, subscriptions } = await footerCustomizer(portal, {
      telemetry: { canManageWeb: true }
    })
    await settle()
    await navigate()
    bed.leave()
    expect(telemetryStore()).toBeUndefined()
    expect(subscriptions).toEqual([])
    expect(portal.getUsageSnapshot).not.toHaveBeenCalled()
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('asks the hub what kind of site a project page is on, and sends the page view as that', async () => {
    const portal = hubWith({ UsageStatisticsLevel: '2' })
    await footerCustomizer(portal, { onHub: false, telemetry: {} })
    await settle()
    await settle()
    expect(portal.getSiteKind).toHaveBeenCalledTimes(1)
    expect(portal.getSiteKind).toHaveBeenCalledWith(PROJECT_SITE_ID)
    bed.leave()
    expect(usageSent()).toEqual([{ c: ALIAS, e: 'page.viewed', s: 'project', n: 1 }])
    // The ids of the site and the hub stay in the browser.
    expect(JSON.stringify(bed.batches())).not.toContain(PROJECT_SITE_ID)
    expect(JSON.stringify(bed.batches())).not.toContain(HUB_SITE_ID)
  })

  it('follows a level the hub has raised since it started, also after a navigation', async () => {
    const portal = hubWith({ ShowFooter: '0', UsageStatisticsLevel: '1' })
    const { navigate } = await footerCustomizer(portal, { telemetry: {} })
    expect(countedTelemetry().usage).toEqual({})
    // An hour later the hub is at Standard, and the level is read anew through the hub's service.
    portal.getGlobalSettings = () =>
      Promise.resolve(new Map([['UsageStatisticsLevel', '2']]) as Map<string, string>)
    bed.advance(61 * 60 * 1000)
    bed.navigate('/sites/prosjektportalen/SitePages/Prosjekter.aspx')
    await navigate()
    await settle()
    // The settings the footer read as it started say 1: handed over again, they would lower it.
    bed.navigate('/sites/prosjektportalen/SitePages/Ressurser.aspx')
    await navigate()
    bed.navigate('/sites/prosjektportalen/SitePages/Gevinster.aspx')
    await navigate()
    expect(countedTelemetry().usage).toEqual({ [PAGE_VIEW]: 2 })
  })

  const denied = Object.assign(new Error('Ingen tilgang'), { status: 403 })
  const missing = Object.assign(new Error('Listen finnes ikke'), { status: 404 })
  const failed = Object.assign(new Error('Serverfeil'), { status: 500 })

  it.each([
    ['the links', { links: denied }, 'loadLinks', 'permission_denied 403'],
    ['the help of the page', { helpContent: missing }, 'loadHelpContent', 'not_found 404'],
    ['the favourite projects', { projects: failed }, 'loadFavoriteProjects', 'server_error 500']
  ])('counts a failed read of %s once, by its error code', async (_, failing, load, error) => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    window.history.replaceState({}, '', `/sites/prosjektportalen/SitePages/${load}.aspx`)
    await footerCustomizer(hubWith({ UsageStatisticsLevel: '3' }, { failing }), {
      telemetry: {}
    })
    expect(countedTelemetry().errors).toEqual({})
    expect(await rendered.props[load]()).toEqual([])
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} ${error}`]: 1 })
  })

  it('does not count favourites a user may not read: the hub denies Prosjekter by design', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const failing = { projects: denied }
    await footerCustomizer(hubWith({ UsageStatisticsLevel: '3' }, { failing }), { telemetry: {} })
    expect(await rendered.props.loadFavoriteProjects()).toEqual([])
    expect(countedTelemetry().errors).toEqual({})
  })

  it('counts a failed read of the installation as the footer starts, at Utvidet only', async () => {
    const failing = { installationLog: denied }
    await footerCustomizer(hubWith({ UsageStatisticsLevel: '3' }, { failing }), { telemetry: {} })
    expect(rendered.props.installEntries).toEqual([])
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} permission_denied 403`]: 1 })

    bed.restore()
    bed = telemetryTestBed()
    await footerCustomizer(hubWith({ UsageStatisticsLevel: '2' }, { failing }), { telemetry: {} })
    expect(countedTelemetry().errors).toEqual({})
  })
})

describe('InstallationEntry', () => {
  it('reads the version without its build hash', () => {
    const entry = new InstallationEntry(INSTALL)
    expect(entry.installVersion.toString()).toBe('1.15.0')
    expect(entry.fullInstallVersion).toBe('1.15.0.a1b2c3d')
    expect(entry.installChannel).toBe('test')
    expect(entry.installedDate).toEqual(new Date(INSTALL.InstallEndTime))
  })
})

describe('HelpContentModel', () => {
  const external = (markdown: string, publicMediaBasePath?: string) => {
    const help = new HelpContentModel(
      {
        Title: 'Hjelp',
        GtURL: 'SitePages/Hjem',
        GtExternalURL: 'https://docs.example/hjelp/side.md'
      },
      undefined
    )
    global.fetch = respond(markdown) as any
    return help.fetchExternalContent(publicMediaBasePath).then(() => help.markdownContent)
  }

  it('matches the pages whose address contains its pattern', () => {
    const help = new HelpContentModel({ GtURL: 'SitePages/Prosjektstatus' }, undefined)
    expect(help.matchPattern('/sites/frisbee/SitePages/Prosjektstatus.aspx')).toBe(true)
    expect(help.matchPattern('/sites/frisbee/SitePages/Hjem.aspx')).toBe(false)
    expect(help.matchPattern('/sites/frisbee/SitePages%2FProsjektstatus.aspx')).toBe(true)
  })

  it('drops the front matter of an external page and keeps a horizontal rule further down', async () => {
    const markdown = ['---', 'title: Hjelp', '---', '# Innhold', 'Første', '', '---', '', 'Andre']
    expect(await external(markdown.join('\n'))).toBe(
      ['# Innhold', 'Første', '', '---', '', 'Andre'].join('\n')
    )
  })

  it('points the media links at the media folder, each link on its own', async () => {
    expect(await external('![a](./media/a.png) og ![b](./media/skjerm 1.png)')).toBe(
      '![a](https://docs.example/hjelp/media/a.png) og ![b](https://docs.example/hjelp/media/skjerm%201.png)'
    )
    expect(await external('![a](./media/a.png)', 'https://cdn.example/media')).toBe(
      '![a](https://cdn.example/media/a.png)'
    )
  })
})
