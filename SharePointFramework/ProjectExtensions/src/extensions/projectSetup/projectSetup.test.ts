// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The customizer reads DEBUG when its module loads. Everything it
// talks to is a stand-in: the site's PnPjs instance (`site.sp`, from `fakeSite`), the hub's portal
// data service and adapter, Microsoft Graph, the tasks (`run.tasks`, made from the setup's data,
// which `run.data` keeps) and the dialogs, which record the props they were last rendered with in
// `dialogs`.
;(globalThis as any).DEBUG = false
/** The project site's PnPjs instance, and the menu URLs SharePoint refuses (their target is gone). */
const site: { sp?: any; refusedUrls: string[] } = { refusedUrls: [] }
const hub = {
  templates: [] as any[],
  lists: {} as Record<string, any[]>,
  failFetch: false,
  language: 1044,
  updates: [] as any[],
  /** Whether the user can add to the hub's project list; `undefined` makes the check fail. */
  canWrite: true as boolean | undefined
}
class FakePortalDataService {
  public web = { select: () => () => Promise.resolve({ Language: hub.language }) }
  public configure() {
    return Promise.resolve(this)
  }
  public getItems(list: string) {
    if (hub.failFetch) return Promise.reject(new Error('Listen finnes ikke'))
    return Promise.resolve(hub.lists[list] ?? [])
  }
  public getProjectData() {
    return Promise.resolve(undefined)
  }
  public currentUserHasPermissionsToList() {
    if (hub.canWrite === undefined) return Promise.reject(new Error('Fant ikke listen'))
    return Promise.resolve(hub.canWrite)
  }
}
const listLogger = { init: jest.fn(), log: jest.fn(() => Promise.resolve()) }
jest.mock('pp365-shared-library', () => ({
  __esModule: true,
  ...jest.requireActual('pp365-shared-library'),
  createSpfiInstance: () => site.sp,
  PortalDataService: FakePortalDataService,
  ListLogger: listLogger
}))
jest.mock('data', () => ({
  SPDataAdapter: {
    configure: () => Promise.resolve(),
    portalDataService: {
      web: {
        lists: {
          getByTitle: () => ({
            items: Object.assign(() => Promise.resolve([]), {
              filter: () => () => Promise.resolve([{ Id: 42 }]),
              getById: (id: number) => ({
                update: (properties: any) => {
                  hub.updates.push({ id, properties })
                  return Promise.resolve()
                }
              })
            })
          })
        }
      }
    }
  }
}))
const graph = { members: [] as { mail: string }[] }
jest.mock('msgraph-helper', () => ({
  __esModule: true,
  default: { Init: () => Promise.resolve(), Get: () => Promise.resolve(graph.members) }
}))
const run: { tasks: any[]; data?: any } = { tasks: [] }
jest.mock('./tasks', () => ({
  getTasks: (data: any) => {
    run.data = data
    return run.tasks
  }
}))
const removal = { deleteCustomizer: jest.fn(() => Promise.resolve()) }
jest.mock('./deleteCustomizer', () => ({ deleteCustomizer: () => removal.deleteCustomizer() }))
const dialogs: Record<string, any> = {}
jest.mock('../../components', () => {
  const dialog = (name: string) => (props: any) => {
    dialogs[name] = props
    return null
  }
  return {
    ErrorDialog: dialog('error'),
    ProgressDialog: dialog('progress'),
    ProjectSetupDialog: dialog('setup')
  }
})

import { act } from '@testing-library/react'
import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import resource from 'SharedResources'
import ProjectSetup from '.'
import { ProjectSetupValidation } from './types'

const PROJECT = 'https://contoso.sharepoint.com/sites/frisbee'
const USER = 'kari@contoso.no'
const TEMPLATES = [
  { id: 1, text: 'Standardmal', autoConfigure: false, iconProps: { iconName: 'Page' } },
  { id: 2, text: 'Byggeprosjekt', autoConfigure: false, iconProps: { iconName: 'Build' } }
]

/** A Quick Launch node of the fake site. */
interface IFakeNode {
  Id: number
  Title: string
  Url: string
  Children: IFakeNode[]
}

/** A Quick Launch node with its children, for `fakeSite`. */
const node = (Title: string, Url: string, Children: IFakeNode[] = []): IFakeNode => ({
  Id: 0,
  Title,
  Url,
  Children
})

/** The menu as its titles, a child after its parent: `Gevinster > Gevinstanalyse`. */
const outline = (nodes: IFakeNode[], parent = ''): string[] =>
  nodes.flatMap(({ Title, Children }) => [
    `${parent}${Title}`,
    ...outline(Children, `${parent}${Title} > `)
  ])

/**
 * The project site, as the customizer's PnPjs instance sees it; `calls` records its writes, and
 * `calls.menu` is its Quick Launch, `quickLaunch` (the menu the template left) to begin with.
 */
function fakeSite(web: Record<string, any> = {}, quickLaunch: IFakeNode[] = []) {
  const info = {
    WebTemplate: 'GROUP',
    Language: 1044,
    IsMultilingual: false,
    Title: 'Frisbeegolfbane',
    AllProperties: {},
    WelcomePage: 'SitePages/Home.aspx',
    GtProjectTemplate: '',
    // Not there on a project set up before 1.13
    GtProjectListContent: undefined as string,
    ...web
  }
  const calls = {
    webUpdates: [] as any[],
    propertyUpdates: [] as any[],
    quickLaunch: [] as any[],
    menu: quickLaunch
  }
  const query = (result: () => any) => {
    const invocable: any = () => Promise.resolve(result())
    invocable.select = () => invocable
    invocable.expand = () => invocable
    invocable.top = () => invocable
    return invocable
  }
  const items = Object.assign(
    query(() => [
      { GtProjectTemplate: info.GtProjectTemplate, GtProjectListContent: info.GtProjectListContent }
    ]),
    {
      getById: () => ({
        update: (properties: any) => {
          calls.propertyUpdates.push(properties)
          return Promise.resolve()
        }
      })
    }
  )
  let lastId = 0
  const number = (nodes: IFakeNode[]) =>
    nodes.forEach((stored) => {
      stored.Id = ++lastId
      number(stored.Children)
    })
  number(quickLaunch)
  const find = (nodes: IFakeNode[], id: number): IFakeNode =>
    nodes.reduce(
      (found, stored) => found ?? (stored.Id === id ? stored : find(stored.Children, id)),
      undefined
    )
  // A level of the menu; `getById` reaches any node, as SharePoint's does.
  const level = (nodes: IFakeNode[]) => ({
    select: () => () => Promise.resolve(nodes.map(({ Id, Title }) => ({ Id, Title }))),
    add: (title: string, url: string) => {
      calls.quickLaunch.push([title, url])
      if (site.refusedUrls.includes(url)) {
        return Promise.reject(new Error(`Cannot open file "${url}".`))
      }
      const added = node(title, url)
      added.Id = ++lastId
      nodes.push(added)
      return Promise.resolve({ Id: added.Id })
    },
    getById: (id: number) => ({ children: level(find(quickLaunch, id).Children) })
  })
  const quicklaunch = level(quickLaunch)
  site.sp = {
    web: {
      select: () => query(() => info),
      rootFolder: { select: () => query(() => ({ WelcomePage: info.WelcomePage })) },
      update: (properties: any) => {
        calls.webUpdates.push(properties)
        return Promise.resolve()
      },
      lists: { getByTitle: () => ({ items }) },
      navigation: { quicklaunch }
    }
  }
  return calls
}

/**
 * A task that reports its progress once, then the entries in `log` (as the engine's warnings and
 * errors are), and passes the parameters on, or fails with `error`.
 */
function task(
  taskName: string,
  error?: Error,
  log: Array<{ message: string; level: string }> = []
) {
  return {
    taskName,
    execute: jest.fn((params: any, onProgress: (...args: any[]) => void) => {
      onProgress(taskName, `${taskName} kjører`, 'Page')
      log.forEach((entry) => onProgress(taskName, `${taskName} kjører`, 'Page', entry))
      return error ? Promise.reject(error) : Promise.resolve({ ...params, [taskName]: true })
    })
  }
}

/**
 * ApplyTemplate's stand-in: passes on, as the task does, the `Navigation.QuickLaunch` of the
 * template and of each extension, one argument each.
 */
function applyTemplate(...declaredQuickLaunch: any[][]) {
  return {
    taskName: 'ApplyTemplate',
    execute: jest.fn((params: any) =>
      Promise.resolve({ ...params, ApplyTemplate: true, declaredQuickLaunch })
    )
  }
}

/** A part of Standardmal's `Navigation.QuickLaunch`, as its schema declares it. */
const STANDARDMAL_QUICK_LAUNCH = [
  { Title: 'Hjem', Url: 'SitePages/ProjectHome.aspx' },
  { Title: 'Prosjektstatus', Url: 'SitePages/Prosjektstatus.aspx' },
  { Title: 'Prosjektlogg', Url: 'Lists/Prosjektlogg/AllItems.aspx' },
  {
    Title: 'Nytteoversikt',
    Url: 'SitePages/Nytteoversikt.aspx',
    Children: [
      {
        Title: 'Nytteanalyse og plan for nyttestyring',
        Url: 'Lists/Nytteanalyse og plan for nyttestyring/AllItems.aspx'
      },
      { Title: 'Nytteoppfølging', Url: 'Lists/Nytteoppflging/AllItems.aspx' }
    ]
  }
]

/** Saves the menu as ProjectWebParts does before the setup runs on a set-up project. */
const saveMenu = (nodes: any[], webUrl = PROJECT) =>
  localStorage.setItem('pp_navigationNodes', JSON.stringify({ webUrl, nodes }))

/** Lets the setup run as far as it can on its own: to a dialog, or to its end. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)))

/** The customizer on the project site, initialised; `context` overrides the page context. */
async function projectSetup({
  web = {},
  legacy = {},
  language = 1044,
  properties = {},
  quickLaunch = []
}: {
  web?: Record<string, any>
  legacy?: Record<string, any>
  language?: number
  properties?: Record<string, any>
  quickLaunch?: IFakeNode[]
} = {}) {
  const calls = fakeSite(web, quickLaunch)
  const top = document.body.appendChild(document.createElement('div'))
  const customizer = new ProjectSetup()
  ;(customizer as any).context = {
    msGraphClientFactory: {},
    placeholderProvider: { tryCreateContent: () => ({ domElement: top }) },
    pageContext: {
      legacyPageContext: {
        isSiteAdmin: true,
        groupId: 'group-1',
        hubSiteId: 'hub-1',
        siteId: '{site-2}',
        ...legacy
      },
      web: { absoluteUrl: PROJECT, language, title: 'Frisbeegolfbane' },
      site: { id: { toString: () => 'site-2' } },
      user: { email: USER }
    }
  }
  ;(customizer as any).properties = properties
  ;(customizer as any).manifest = { version: '1.15.0' }
  await act(() => customizer.onInit())
  await settle()
  return { customizer, calls }
}

/** Picks `template` in the setup dialog and lets the setup run. */
async function setUpWith(template = TEMPLATES[0]) {
  act(() => {
    dialogs.setup.onSubmit({
      selectedTemplate: template,
      selectedExtensions: [],
      selectedContentConfig: []
    })
  })
  await settle()
}

let consoleError: jest.SpyInstance

beforeEach(() => {
  for (const name of Object.keys(dialogs)) delete dialogs[name]
  hub.templates = TEMPLATES.map((template) => ({ ...template }))
  hub.lists = { [resource.Lists_TemplateOptions_Title]: hub.templates }
  hub.failFetch = false
  hub.language = 1044
  hub.updates = []
  hub.canWrite = true
  site.refusedUrls = []
  graph.members = [{ mail: USER }]
  run.tasks = [task('PreTask'), task('SitePermissions'), task('ApplyTemplate')]
  removal.deleteCustomizer.mockClear()
  listLogger.log.mockClear()
  sessionStorage.clear()
  localStorage.clear()
  // jsdom cannot navigate; the setup reloads the page or goes to the project at the end.
  // Every other error still reaches the test output.
  // eslint-disable-next-line no-console
  const original = console.error
  consoleError = jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    if (String(args[0]?.message ?? args[0]).includes('Not implemented: navigation')) return
    original(...args)
  })
})

afterEach(() => {
  consoleError.mockRestore()
  document.body.innerHTML = ''
})

describe('ProjectSetup', () => {
  it('asks for the template on a new project, with the templates of the hub', async () => {
    await projectSetup({ properties: { tasks: ['ApplyTemplate'] } })
    expect(dialogs.setup.data.templates.map(({ text }) => text)).toEqual([
      'Standardmal',
      'Byggeprosjekt'
    ])
    expect(dialogs.setup.version).toBe('v1.15.0')
    expect(dialogs.setup.tasks).toEqual(['ApplyTemplate'])
    expect(dialogs.setup.validation).toBe(ProjectSetupValidation.Ready)
    expect(dialogs.error).toBeUndefined()
  })

  it('runs the tasks in order, passing each one what the last one returned, and finishes', async () => {
    await projectSetup()
    await setUpWith()
    const [preTask, permissions, template] = run.tasks
    expect(preTask.execute).toHaveBeenCalled()
    expect(permissions.execute.mock.calls[0][0]).toMatchObject({ PreTask: true })
    expect(template.execute.mock.calls[0][0]).toMatchObject({
      PreTask: true,
      SitePermissions: true
    })
    expect(dialogs.progress).toMatchObject({ isComplete: true, currentStep: 3, totalSteps: 3 })
    expect(dialogs.progress.taskProgress.map(({ status }) => status)).toEqual([
      'completed',
      'completed',
      'completed'
    ])
    expect(dialogs.progress.taskProgress[1].entries.map(({ message }) => message)).toEqual([
      'SitePermissions kjører'
    ])
    expect(removal.deleteCustomizer).toHaveBeenCalledTimes(1)
    expect(listLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: '_startProvision', component: 'ProjectSetup' })
    )
    dialogs.progress.onDismiss()
    expect(consoleError).toHaveBeenCalled()
  })

  it('runs only the configured tasks, and always the pre-task', async () => {
    await projectSetup({ properties: { tasks: ['ApplyTemplate'] } })
    await setUpWith()
    expect(run.tasks.map(({ execute }) => execute.mock.calls.length)).toEqual([1, 0, 1])
    expect(dialogs.progress.totalSteps).toBe(2)
  })

  it('leaves the last dialog out when the page is not to be reloaded', async () => {
    await projectSetup({ properties: { skipReload: true } })
    await setUpWith()
    expect(dialogs.progress.isComplete).toBeUndefined()
    expect(removal.deleteCustomizer).toHaveBeenCalled()
  })

  it('shows the failed step with its error in the log, and closes when asked', async () => {
    run.tasks[1] = task('SitePermissions', new Error('Mangler tilgang til gruppen'))
    await projectSetup()
    await setUpWith()
    expect(run.tasks[2].execute).not.toHaveBeenCalled()
    expect(dialogs.progress.error.message).toBe('Mangler tilgang til gruppen')
    expect(dialogs.progress.iconName).toBe('ErrorBadge')
    expect(dialogs.progress.taskProgress.map(({ status }) => status)).toEqual([
      'completed',
      'error',
      'pending'
    ])
    const entries = dialogs.progress.taskProgress[1].entries
    expect(entries[entries.length - 1]).toMatchObject({
      message: 'Mangler tilgang til gruppen',
      level: 'error'
    })
    expect(listLogger.log).toHaveBeenCalledWith(expect.objectContaining({ level: 'Error' }))
    await act(() => dialogs.progress.onDismiss())
    expect(removal.deleteCustomizer).not.toHaveBeenCalled()
  })

  it('stops when the user closes the setup dialog', async () => {
    await projectSetup()
    // The dismissal rejects, and the error dialog renders from the setup's catch a few microtasks
    // later: one act around both, or React 18 sees the render outside it.
    await act(() => {
      dialogs.setup.onDismiss()
      return new Promise((resolve) => setTimeout(resolve, 0))
    })
    // A title and a message that differ, shown as information: closing the wizard is no error.
    expect(dialogs.error.error.message).toBe(strings.SetupAbortedText)
    expect(dialogs.error.error.stack).toBe(strings.SetupAbortedMessage)
    expect(strings.SetupAbortedMessage).not.toBe(strings.SetupAbortedText)
    expect(dialogs.error.intent).toBe('info')
    expect(run.tasks[0].execute).not.toHaveBeenCalled()
  })

  it('configures itself from a template that says so, without asking', async () => {
    hub.templates[1].autoConfigure = true
    await projectSetup()
    expect(dialogs.setup).toBeUndefined()
    expect(dialogs.progress.iconName).toBe('Build')
    expect(dialogs.progress.isComplete).toBe(true)
  })

  it("offers only the site's locked template when the site has one", async () => {
    await projectSetup({ web: { AllProperties: { pp_frisbee_template: 'Byggeprosjekt' } } })
    expect(dialogs.setup.data.templates).toEqual([
      expect.objectContaining({ text: 'Byggeprosjekt', isLocked: true })
    ])
  })

  it('tells whether the project already has a template', async () => {
    await projectSetup({ web: { GtProjectTemplate: 'Standardmal' } })
    expect(dialogs.setup.data.hasExistingTemplate).toBe(true)
  })

  it('tells the list content earlier runs added to the project', async () => {
    await projectSetup({
      web: { GtProjectTemplate: 'Standardmal', GtProjectListContent: 'Fasesjekkpunkter' }
    })
    expect(dialogs.setup.data.addedListContent).toBe('Fasesjekkpunkter')
  })

  it('tells no list content for a project whose properties do not record it (set up before 1.13)', async () => {
    await projectSetup({ web: { GtProjectTemplate: 'Standardmal' } })
    expect(dialogs.setup.data.addedListContent).toBe('')
  })

  it('leaves out of a forced template the list content the project has from an earlier run', async () => {
    hub.templates[1] = { ...hub.templates[1], extensions: [], contentConfig: [10, 11] }
    hub.lists[resource.Lists_ListContent_Title] = [
      { id: 10, text: 'Fasesjekkpunkter' },
      { id: 11, text: 'Planneroppgaver' },
      { id: 12, text: 'Tidslinjeelementer' }
    ]
    await projectSetup({
      web: {
        WelcomePage: 'SitePages/Prosjektforside.aspx',
        GtProjectTemplate: 'Standardmal',
        GtProjectListContent: 'Fasesjekkpunkter'
      },
      properties: { forceTemplate: 'Byggeprosjekt' }
    })
    expect(dialogs.setup).toBeUndefined()
    expect(run.data.selectedContentConfig.map(({ text }) => text)).toEqual(['Planneroppgaver'])
  })

  it('says so when the data for the setup cannot be read from the hub', async () => {
    hub.failFetch = true
    await projectSetup()
    expect(dialogs.error.error.message).toBe(strings.GetSetupDataErrorMessage)
  })

  it.each([
    [
      'a site that is not connected to a hub',
      { legacy: { hubSiteId: '' } },
      strings.NoHubSiteErrorMessage,
      false
    ],
    [
      'a user who is not a site admin',
      { legacy: { isSiteAdmin: false } },
      strings.NotSiteAdminErrorMessage,
      false
    ],
    ['a site without a group', { legacy: { groupId: null } }, strings.NoGroupIdErrorMessage, true],
    ['the hub itself', { legacy: { siteId: '{hub-1}' } }, strings.IsHubSiteErrorMessage, true],
    [
      'a site in another language than the hub',
      { language: 1033 },
      strings.InvalidLanguageErrorMessage,
      true
    ]
  ])('refuses %s', async (_, options, message, removed) => {
    await projectSetup(options)
    expect(dialogs.error.error.message).toBe(message)
    expect(dialogs.setup).toBeUndefined()
    expect(removal.deleteCustomizer).toHaveBeenCalledTimes(removed ? 1 : 0)
  })

  it('warns, rather than fails, about a missing hub', async () => {
    await projectSetup({ legacy: { hubSiteId: '' } })
    expect(dialogs.error.intent).toBe('warning')
  })

  it('removes itself from a Teams channel site without a word', async () => {
    await projectSetup({ web: { WebTemplate: 'TEAMCHANNEL' } })
    expect(removal.deleteCustomizer).toHaveBeenCalledTimes(1)
    expect(dialogs.error).toBeUndefined()
    expect(dialogs.setup).toBeUndefined()
  })

  it('goes on with a warning for Planner when the user is not a member of the group', async () => {
    graph.members = [{ mail: 'ola@contoso.no' }]
    await projectSetup()
    expect(dialogs.setup.validation).toBe(ProjectSetupValidation.UserNotGroupMember)
  })

  it('offers the setup again, or the project, on a project that is set up already', async () => {
    await projectSetup({ web: { WelcomePage: 'SitePages/Prosjektforside.aspx' } })
    expect(dialogs.error.error.name).toBe('AlreadySetup')
    await act(() => {
      dialogs.error.onSetupClick()
    })
    await settle()
    expect(dialogs.setup).toBeDefined()
  })

  it('removes itself when the user goes on to a project that is set up already', async () => {
    await projectSetup({ web: { WelcomePage: 'SitePages/Prosjektforside.aspx' } })
    await act(() => dialogs.error.onDismiss())
    expect(removal.deleteCustomizer).toHaveBeenCalledTimes(1)
  })

  it('runs again on a project that is set up when the session asks for it, once', async () => {
    sessionStorage.setItem('pp_skipAlreadySetupCheck', 'true')
    await projectSetup({ web: { WelcomePage: 'SitePages/Prosjektforside.aspx' } })
    expect(dialogs.setup).toBeDefined()
    expect(sessionStorage.getItem('pp_skipAlreadySetupCheck')).toBeNull()
  })

  it('turns a set-up project into a parent project, with the links of its old menu, when the template is forced', async () => {
    saveMenu([
      {
        Title: 'Dokumenter',
        SimpleUrl: '/sites/frisbee/Delte dokumenter',
        Nodes: [{ Title: 'Møter', SimpleUrl: '/sites/frisbee/Delte dokumenter/Møter', Nodes: [] }]
      },
      { Title: 'Banekart', SimpleUrl: 'https://kart.contoso.no/frisbee', Nodes: [] },
      {
        Title: strings.RecycleBinText,
        SimpleUrl: '/sites/frisbee/_layouts/15/RecycleBin.aspx',
        Nodes: []
      }
    ])
    const { calls } = await projectSetup({
      web: { WelcomePage: 'SitePages/Prosjektforside.aspx' },
      properties: { forceTemplate: 'Byggeprosjekt' },
      quickLaunch: [
        node('Hjem', '/sites/frisbee/SitePages/ProjectHome.aspx'),
        node('Dokumenter', '/sites/frisbee/Delte dokumenter/Forms/AllItems.aspx')
      ]
    })
    expect(dialogs.setup).toBeUndefined()
    expect(outline(calls.menu)).toEqual(['Hjem', 'Dokumenter', 'Dokumenter > Møter', 'Banekart'])
    expect(localStorage.getItem('pp_navigationNodes')).toBeNull()
    expect(calls.propertyUpdates).toEqual([
      { GtIsParentProject: true, GtChildProjects: JSON.stringify([]) }
    ])
    expect(hub.updates).toEqual([{ id: 42, properties: { GtIsParentProject: true } }])
    expect(dialogs.progress.isComplete).toBe(true)
  })

  it('adds back, after «Kjør oppsettveiviser», the saved links whose title the menu lacks at their level', async () => {
    saveMenu([
      { Title: 'Hjem', SimpleUrl: '/sites/frisbee/SitePages/ProjectHome.aspx', Nodes: [] },
      {
        Title: 'Gevinster',
        SimpleUrl: '/sites/frisbee/SitePages/Gevinstoversikt.aspx',
        Nodes: [
          { Title: 'Gevinstanalyse', SimpleUrl: '/sites/frisbee/Lists/Gevinstanalyse', Nodes: [] },
          { Title: 'Nyttekalkyle', SimpleUrl: 'https://regneark.contoso.no/nytte', Nodes: [] },
          { Title: 'Nyttekalkyle', SimpleUrl: 'https://regneark.contoso.no/nytte', Nodes: [] }
        ]
      },
      {
        Title: 'Lenker',
        SimpleUrl: 'http://linkless.header/',
        Nodes: [
          { Title: 'Banekart', SimpleUrl: 'https://kart.contoso.no/frisbee', Nodes: [] },
          { Title: 'Gammelt arkiv', SimpleUrl: '/sites/frisbee/Slettet', Nodes: [] }
        ]
      }
    ])
    site.refusedUrls = ['/sites/frisbee/Slettet']
    const { calls } = await projectSetup({
      web: { WelcomePage: 'SitePages/Prosjektforside.aspx' },
      properties: { forceTemplate: '__SELECT_TEMPLATE__', skipAlreadySetupCheck: true },
      quickLaunch: [
        node('Hjem', '/sites/frisbee/SitePages/ProjectHome.aspx'),
        node('Gevinster', '/sites/frisbee/SitePages/Gevinstoversikt.aspx', [
          node('Gevinstanalyse', '/sites/frisbee/Lists/Gevinstanalyse')
        ])
      ]
    })
    await setUpWith()
    expect(outline(calls.menu)).toEqual([
      'Hjem',
      'Gevinster',
      'Gevinster > Gevinstanalyse',
      'Gevinster > Nyttekalkyle',
      'Lenker',
      'Lenker > Banekart'
    ])
    expect(calls.quickLaunch).toContainEqual(['Gammelt arkiv', '/sites/frisbee/Slettet'])
    expect(localStorage.getItem('pp_navigationNodes')).toBeNull()
    expect(calls.propertyUpdates).toEqual([])
    expect(hub.updates).toEqual([])
    expect(dialogs.progress.isComplete).toBe(true)
    expect(dialogs.progress.error).toBeUndefined()
  })

  it("adds back only the owners' links when an extension's menu replaced the template's", async () => {
    // «Enkel venstremeny» declares its own QuickLaunch, so the template's is left out, and the
    // extension's deleted the template's nodes it does not have.
    run.tasks[2] = applyTemplate(STANDARDMAL_QUICK_LAUNCH, [
      { Title: 'Hjem', Url: 'SitePages/ProjectHome.aspx' },
      { Title: 'Prosjektstatus', Url: 'SitePages/Prosjektstatus.aspx' }
    ])
    saveMenu([
      { Title: 'Hjem', SimpleUrl: '/sites/frisbee/SitePages/ProjectHome.aspx', Nodes: [] },
      {
        Title: 'Prosjektlogg',
        SimpleUrl: '/sites/frisbee/Lists/Prosjektlogg/AllItems.aspx',
        Nodes: []
      },
      {
        Title: 'Nytteoversikt',
        SimpleUrl: '/sites/frisbee/SitePages/Nytteoversikt.aspx',
        Nodes: [
          {
            Title: 'Nytteoppfølging',
            SimpleUrl: '/sites/frisbee/Lists/Nytteoppflging/AllItems.aspx',
            Nodes: []
          }
        ]
      },
      { Title: 'Banekart', SimpleUrl: 'https://kart.contoso.no/frisbee', Nodes: [] }
    ])
    const { calls } = await projectSetup({
      web: { WelcomePage: 'SitePages/Prosjektforside.aspx' },
      properties: { forceTemplate: '__SELECT_TEMPLATE__', skipAlreadySetupCheck: true },
      quickLaunch: [
        node('Hjem', '/sites/frisbee/SitePages/ProjectHome.aspx'),
        node('Prosjektstatus', '/sites/frisbee/SitePages/Prosjektstatus.aspx')
      ]
    })
    await setUpWith()
    expect(outline(calls.menu)).toEqual(['Hjem', 'Prosjektstatus', 'Banekart'])
    expect(calls.quickLaunch).toEqual([['Banekart', 'https://kart.contoso.no/frisbee']])
    expect(dialogs.progress.isComplete).toBe(true)
  })

  it('adds back no node of the template under a title it had before a rename, nor its children', async () => {
    run.tasks[2] = applyTemplate(STANDARDMAL_QUICK_LAUNCH)
    saveMenu([
      { Title: 'Hjem', SimpleUrl: '/sites/frisbee/SitePages/ProjectHome.aspx', Nodes: [] },
      {
        Title: 'Gevinstoversikt',
        SimpleUrl: '/sites/frisbee/SitePages/Gevinstoversikt.aspx',
        Nodes: [
          {
            Title: 'Gevinstanalyse og gevinstrealiseringsplan',
            SimpleUrl:
              '/sites/frisbee/Lists/Gevinstanalyse og gevinstrealiseringsplan/AllItems.aspx',
            Nodes: []
          },
          { Title: 'Nyttekalkyle', SimpleUrl: 'https://regneark.contoso.no/nytte', Nodes: [] }
        ]
      },
      { Title: 'Banekart', SimpleUrl: 'https://kart.contoso.no/frisbee', Nodes: [] }
    ])
    const { calls } = await projectSetup({
      web: { WelcomePage: 'SitePages/Prosjektforside.aspx' },
      properties: { forceTemplate: '__SELECT_TEMPLATE__', skipAlreadySetupCheck: true },
      quickLaunch: [
        node('Hjem', '/sites/frisbee/SitePages/ProjectHome.aspx'),
        node('Nytteoversikt', '/sites/frisbee/SitePages/Nytteoversikt.aspx', [
          node(
            'Nytteanalyse og plan for nyttestyring',
            '/sites/frisbee/Lists/Nytteanalyse og plan for nyttestyring/AllItems.aspx'
          )
        ])
      ]
    })
    await setUpWith()
    expect(outline(calls.menu)).toEqual([
      'Hjem',
      'Nytteoversikt',
      'Nytteoversikt > Nytteanalyse og plan for nyttestyring',
      'Banekart'
    ])
  })

  it('adds back a node under an earlier title of a template whose menu has no successor for it', async () => {
    // «Gjør om til overordnet prosjekt»: the parent template's menu has none of the project's
    // nodes, so all of them come back, the benefit overview under its old title too.
    run.tasks[2] = applyTemplate([
      { Title: 'Underordnet innhold', Url: 'SitePages/Underordnet.aspx' }
    ])
    saveMenu([
      { Title: 'Hjem', SimpleUrl: '/sites/frisbee/SitePages/ProjectHome.aspx', Nodes: [] },
      {
        Title: 'Gevinstoversikt',
        SimpleUrl: '/sites/frisbee/SitePages/Gevinstoversikt.aspx',
        Nodes: []
      }
    ])
    const { calls } = await projectSetup({
      web: { WelcomePage: 'SitePages/Prosjektforside.aspx' },
      properties: { forceTemplate: 'Byggeprosjekt' },
      quickLaunch: [node('Underordnet innhold', '/sites/frisbee/SitePages/Underordnet.aspx')]
    })
    expect(outline(calls.menu)).toEqual(['Underordnet innhold', 'Hjem', 'Gevinstoversikt'])
  })

  it("adds back an owner's link under a node of the template, but not a node with the template's URL", async () => {
    // The template's Prosjektlogg has no children, so the engine deleted the owner's link under
    // it. «Logg» is the template's Prosjektlogg, renamed by an owner: the engine added the
    // template's node and deleted it.
    run.tasks[2] = applyTemplate(STANDARDMAL_QUICK_LAUNCH)
    saveMenu([
      { Title: 'Hjem', SimpleUrl: '/sites/frisbee/SitePages/ProjectHome.aspx', Nodes: [] },
      {
        Title: 'Logg',
        SimpleUrl: '/sites/frisbee/Lists/Prosjektlogg/AllItems.aspx',
        Nodes: [{ Title: 'Møtereferater', SimpleUrl: 'https://møter.contoso.no', Nodes: [] }]
      },
      {
        Title: 'Prosjektlogg',
        SimpleUrl: '/sites/frisbee/Lists/Prosjektlogg/AllItems.aspx',
        Nodes: [
          {
            Title: 'Beslutningslogg',
            SimpleUrl: '/sites/frisbee/Lists/Prosjektlogg/Beslutninger.aspx',
            Nodes: []
          }
        ]
      },
      {
        Title: 'Nytteoversikt',
        SimpleUrl: '/sites/frisbee/SitePages/Nytteoversikt.aspx',
        Nodes: [
          {
            Title: 'Nytteanalyse',
            SimpleUrl:
              '/sites/frisbee/Lists/Nytteanalyse%20og%20plan%20for%20nyttestyring/AllItems.aspx',
            Nodes: []
          },
          { Title: 'Nyttekalkyle', SimpleUrl: 'https://regneark.contoso.no/nytte', Nodes: [] }
        ]
      }
    ])
    const { calls } = await projectSetup({
      web: { WelcomePage: 'SitePages/Prosjektforside.aspx' },
      properties: { forceTemplate: '__SELECT_TEMPLATE__', skipAlreadySetupCheck: true },
      quickLaunch: [
        node('Hjem', '/sites/frisbee/SitePages/ProjectHome.aspx'),
        node('Prosjektlogg', '/sites/frisbee/Lists/Prosjektlogg/AllItems.aspx'),
        node('Nytteoversikt', '/sites/frisbee/SitePages/Nytteoversikt.aspx', [
          node(
            'Nytteanalyse og plan for nyttestyring',
            '/sites/frisbee/Lists/Nytteanalyse og plan for nyttestyring/AllItems.aspx'
          )
        ])
      ]
    })
    await setUpWith()
    expect(outline(calls.menu)).toEqual([
      'Hjem',
      'Prosjektlogg',
      'Prosjektlogg > Beslutningslogg',
      'Nytteoversikt',
      'Nytteoversikt > Nytteanalyse og plan for nyttestyring',
      'Nytteoversikt > Nyttekalkyle'
    ])
  })

  it('adds back no menu saved for another site', async () => {
    saveMenu(
      [{ Title: 'Banekart', SimpleUrl: 'https://kart.contoso.no/frisbee', Nodes: [] }],
      'https://contoso.sharepoint.com/sites/alfa'
    )
    const { calls } = await projectSetup({
      web: { WelcomePage: 'SitePages/Prosjektforside.aspx' },
      properties: { forceTemplate: '__SELECT_TEMPLATE__', skipAlreadySetupCheck: true },
      quickLaunch: [node('Hjem', '/sites/frisbee/SitePages/ProjectHome.aspx')]
    })
    await setUpWith()
    expect(outline(calls.menu)).toEqual(['Hjem'])
    expect(localStorage.getItem('pp_navigationNodes')).toBeNull()
    expect(dialogs.progress.isComplete).toBe(true)
  })

  it('goes on without the old menu when the saved one cannot be read', async () => {
    localStorage.setItem('pp_navigationNodes', '{"webUrl":')
    const { calls } = await projectSetup({
      web: { WelcomePage: 'SitePages/Prosjektforside.aspx' },
      properties: { forceTemplate: 'Byggeprosjekt' },
      quickLaunch: [node('Hjem', '/sites/frisbee/SitePages/ProjectHome.aspx')]
    })
    expect(outline(calls.menu)).toEqual(['Hjem'])
    expect(localStorage.getItem('pp_navigationNodes')).toBeNull()
    expect(hub.updates).toEqual([{ id: 42, properties: { GtIsParentProject: true } }])
    expect(dialogs.progress.isComplete).toBe(true)
  })

  it('completes with a warning, and logs the errors to the hub, when a step logged errors', async () => {
    run.tasks[2] = task('ApplyTemplate', undefined, [
      { message: '(Lists): (processList): Failed to add field GtGainLookup', level: 'error' },
      { message: '(SiteFields): Field GtProjectType keeps its type', level: 'warning' }
    ])
    await projectSetup()
    await setUpWith()
    expect(dialogs.progress.taskProgress.map(({ status }) => status)).toEqual([
      'completed',
      'completed',
      'warning'
    ])
    expect(dialogs.progress.isComplete).toBe(true)
    expect(dialogs.progress.warning).toEqual({
      title: strings.SetupCompletedWithErrorsTitle,
      text: format(strings.SetupCompletedWithErrorsMessage, 1)
    })
    expect(listLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'Warning',
        message: [
          format(strings.ProjectProvisioningErrorsLogText, 'Frisbeegolfbane', 1),
          'ApplyTemplate: (Lists): (processList): Failed to add field GtGainLookup'
        ].join('\n')
      })
    )
  })

  it('tells both, when a step logged errors and the project is not registered in the portfolio', async () => {
    hub.canWrite = false
    run.tasks[2] = task('ApplyTemplate', undefined, [
      { message: '(Lists): (processList): Failed to add field GtGainLookup', level: 'error' }
    ])
    await projectSetup()
    await setUpWith()
    expect(dialogs.progress.warning.title).toBe(strings.SetupCompletedWithErrorsTitle)
    expect(dialogs.progress.warning.text).toContain(
      format(strings.SetupCompletedWithErrorsMessage, 1)
    )
    expect(dialogs.progress.warning.text).toContain(strings.ProjectNotRegisteredInHubTitle)
    expect(listLogger.log).not.toHaveBeenCalled()
  })

  it('warns before the setup, and writes nothing to the hub, when the user cannot add to its project list', async () => {
    hub.canWrite = false
    await projectSetup()
    expect(dialogs.setup.data.hasHubWriteAccess).toBe(false)
    await setUpWith()
    expect(run.tasks[2].execute).toHaveBeenCalled()
    expect(listLogger.log).not.toHaveBeenCalled()
    expect(dialogs.progress.isComplete).toBe(true)
    expect(dialogs.progress.warning.title).toBe(strings.ProjectNotRegisteredInHubTitle)
    expect(removal.deleteCustomizer).toHaveBeenCalledTimes(1)
  })

  it('sets up as usual when the write access to the hub cannot be checked', async () => {
    hub.canWrite = undefined
    await projectSetup()
    expect(dialogs.setup.data.hasHubWriteAccess).toBeUndefined()
    await setUpWith()
    expect(listLogger.log).toHaveBeenCalled()
    expect(dialogs.progress.warning).toBeUndefined()
  })

  it('leaves the hub alone when a forced parent project is set up without write access to it', async () => {
    hub.canWrite = false
    saveMenu([])
    await projectSetup({
      web: { WelcomePage: 'SitePages/Prosjektforside.aspx' },
      properties: { forceTemplate: 'Byggeprosjekt' }
    })
    expect(hub.updates).toEqual([])
    expect(dialogs.progress.warning.title).toBe(strings.ProjectNotRegisteredInHubTitle)
  })

  it('switches a multilingual site to one language and reloads before the setup', async () => {
    // In the browser the reload ends this run; under jsdom the run goes on and reads the flag
    // back at once, so the flag is checked as it is written.
    const setItem = jest.spyOn(Storage.prototype, 'setItem')
    const { calls } = await projectSetup({ web: { IsMultilingual: true } })
    expect(calls.webUpdates).toEqual([{ IsMultilingual: false }])
    expect(setItem).toHaveBeenCalledWith('pp_languagesRemoved_site-2', 'true')
    expect(consoleError).toHaveBeenCalled()
    setItem.mockRestore()
  })

  it('logs the language change on the first load after it', async () => {
    sessionStorage.setItem('pp_languagesRemoved_site-2', 'true')
    await projectSetup()
    expect(listLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: '_removeAlternativeLanguages' })
    )
    expect(sessionStorage.getItem('pp_languagesRemoved_site-2')).toBeNull()
  })
})
