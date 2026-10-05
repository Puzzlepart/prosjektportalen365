// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter hands out the test's portal data service, and
// the footer component (tested on its own) records the props the customizer renders it with.
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  portalDataService: undefined as any,
  checkProjectAdminPermissions: jest.fn(() => Promise.resolve(true))
}
jest.mock('../../data/SPDataAdapter', () => ({ __esModule: true, default: adapter }))
const rendered: { props?: any } = {}
jest.mock('components/Footer', () => ({
  Footer: (props: any) => {
    rendered.props = props
    return null
  }
}))

import { PlaceholderName } from '@microsoft/sp-application-base'
import { ProjectAdminPermission } from 'pp365-shared-library'
import resource from 'SharedResources'
import FooterApplicationCustomizer from '.'
import { HelpContentModel, InstallationEntry } from './types'

const HUB = 'https://contoso.sharepoint.com/sites/pp365'
const PROJECT = 'https://contoso.sharepoint.com/sites/frisbee'
const INSTALL = {
  InstallEndTime: '2026-09-30T10:00:00Z',
  InstallVersion: '1.15.0.a1b2c3d',
  InstallChannel: 'test'
}

/** A portal data service stand-in with the lists and calls the customizer reads. */
function portalDataService({
  isAvailable = true,
  settings = { ShowFooter: '1' } as Record<string, string>,
  links = [] as any[],
  assistantGroup = [] as any[],
  hubProjects = [] as any[],
  project = null as any,
  helpItems = [] as any[]
} = {}) {
  const lists = {
    [resource.Lists_InstallationLog_Title]: {
      items: { orderBy: () => ({ top: () => () => Promise.resolve([INSTALL]) }) }
    },
    [resource.Lists_Links_Title]: { items: () => Promise.resolve(links) },
    [resource.Lists_Projects_Title]: {
      items: { select: () => ({ top: () => () => Promise.resolve(hubProjects) }) }
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
    getItems: (_list: string, model: any, query: any) => {
      requests.helpContent = query
      return Promise.resolve(helpItems.map((item) => new model(item, undefined)))
    },
    requests
  }
}

/** The customizer on the hub (or a project site), initialised with `portal`. */
async function footerCustomizer(portal = portalDataService(), { onHub = true } = {}) {
  adapter.portalDataService = portal
  const navigated: (() => Promise<void>)[] = []
  const placeholder = { domElement: document.createElement('div'), dispose: jest.fn() }
  const context = {
    pageContext: {
      web: { absoluteUrl: onHub ? HUB : PROJECT },
      legacyPageContext: {
        siteId: onHub ? '{hub-1}' : '{site-2}',
        hubSiteId: 'hub-1',
        isSiteAdmin: true
      }
    },
    application: {
      navigatedEvent: {
        add: (observer: any, handler: () => Promise<void>) => navigated.push(handler.bind(observer))
      }
    },
    placeholderProvider: { tryCreateContent: jest.fn(() => placeholder) }
  }
  const customizer = new FooterApplicationCustomizer()
  ;(customizer as any).context = context
  ;(customizer as any).properties = { publicMediaBasePath: 'https://media.example/media' }
  await customizer.onInit()
  const navigate = async () => {
    for (const handler of navigated) await handler()
  }
  return { context, placeholder, navigate }
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
