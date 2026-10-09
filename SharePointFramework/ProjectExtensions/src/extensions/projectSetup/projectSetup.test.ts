// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The customizer reads DEBUG when its module loads. Everything it
// talks to is a stand-in: the site's PnPjs instance (`site.sp`, from `fakeSite`), the hub's portal
// data service and adapter, Microsoft Graph, the tasks (`run.tasks`) and the dialogs, which record
// the props they were last rendered with in `dialogs`.
;(globalThis as any).DEBUG = false
const site: { sp?: any } = {}
const hub = {
  templates: [] as any[],
  lists: {} as Record<string, any[]>,
  failFetch: false,
  language: 1044,
  updates: [] as any[]
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
const run: { tasks: any[] } = { tasks: [] }
jest.mock('./tasks', () => ({ getTasks: () => run.tasks }))
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
import resource from 'SharedResources'
import ProjectSetup from '.'
import { ProjectSetupValidation } from './types'

const PROJECT = 'https://contoso.sharepoint.com/sites/frisbee'
const USER = 'kari@contoso.no'
const TEMPLATES = [
  { id: 1, text: 'Standardmal', autoConfigure: false, iconProps: { iconName: 'Page' } },
  { id: 2, text: 'Byggeprosjekt', autoConfigure: false, iconProps: { iconName: 'Build' } }
]

/** The project site, as the customizer's PnPjs instance sees it; `calls` records its writes. */
function fakeSite(web: Record<string, any> = {}) {
  const info = {
    WebTemplate: 'GROUP',
    Language: 1044,
    IsMultilingual: false,
    Title: 'Frisbeegolfbane',
    AllProperties: {},
    WelcomePage: 'SitePages/Home.aspx',
    GtProjectTemplate: '',
    ...web
  }
  const calls = { webUpdates: [] as any[], propertyUpdates: [] as any[], quickLaunch: [] as any[] }
  const query = (result: () => any) => {
    const invocable: any = () => Promise.resolve(result())
    invocable.select = () => invocable
    invocable.expand = () => invocable
    invocable.top = () => invocable
    return invocable
  }
  const items = Object.assign(
    query(() => [{ GtProjectTemplate: info.GtProjectTemplate }]),
    {
      getById: () => ({
        update: (properties: any) => {
          calls.propertyUpdates.push(properties)
          return Promise.resolve()
        }
      })
    }
  )
  const quicklaunch = {
    add: (title: string, url: string) => {
      calls.quickLaunch.push([title, url])
      return Promise.resolve({ Id: calls.quickLaunch.length })
    },
    getById: () => ({ children: quicklaunch })
  }
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

/** A task that reports its progress once and passes the parameters on, or fails with `error`. */
function task(taskName: string, error?: Error) {
  return {
    taskName,
    execute: jest.fn((params: any, onProgress: (...args: any[]) => void) => {
      onProgress(taskName, `${taskName} kjører`, 'Page')
      return error ? Promise.reject(error) : Promise.resolve({ ...params, [taskName]: true })
    })
  }
}

/** Lets the setup run as far as it can on its own: to a dialog, or to its end. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)))

/** The customizer on the project site, initialised; `context` overrides the page context. */
async function projectSetup({
  web = {},
  legacy = {},
  language = 1044,
  properties = {}
}: {
  web?: Record<string, any>
  legacy?: Record<string, any>
  language?: number
  properties?: Record<string, any>
} = {}) {
  const calls = fakeSite(web)
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
    expect(dialogs.error.error.message).toBe(strings.SetupAbortedText)
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

  it('turns a set-up project into a parent project with its old menu when the template is forced', async () => {
    localStorage.setItem(
      'pp_navigationNodes',
      JSON.stringify([
        {
          Title: 'Dokumenter',
          SimpleUrl: '/sites/frisbee/Delte dokumenter',
          Nodes: [{ Title: 'Møter', SimpleUrl: '/sites/frisbee/Delte dokumenter/Møter' }]
        },
        {
          Title: strings.RecycleBinText,
          SimpleUrl: '/sites/frisbee/_layouts/15/RecycleBin.aspx',
          Nodes: []
        }
      ])
    )
    const { calls } = await projectSetup({
      web: { WelcomePage: 'SitePages/Prosjektforside.aspx' },
      properties: { forceTemplate: 'Byggeprosjekt' }
    })
    expect(dialogs.setup).toBeUndefined()
    expect(calls.quickLaunch).toEqual([
      ['Dokumenter', '/sites/frisbee/Delte dokumenter'],
      ['Møter', '/sites/frisbee/Delte dokumenter/Møter']
    ])
    expect(calls.propertyUpdates).toEqual([
      { GtIsParentProject: true, GtChildProjects: JSON.stringify([]) }
    ])
    expect(hub.updates).toEqual([{ id: 42, properties: { GtIsParentProject: true } }])
    expect(dialogs.progress.isComplete).toBe(true)
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
