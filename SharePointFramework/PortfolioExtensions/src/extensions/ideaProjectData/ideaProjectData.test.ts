// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Every `@pnp/*` import maps to the one PnP stub, so this mock is
// all of them in this file: it keeps the stub and only lets `spfi()` hand out the test's
// stand-in. The project data dialog has its own test; here it records what it was shown with.
const mockSp: { current: any } = { current: undefined }
jest.mock('@pnp/sp', () => {
  const stub = jest.requireActual('@pnp/sp')
  return new Proxy(stub, {
    get: (target, prop) =>
      prop === 'spfi' ? () => ({ using: () => mockSp.current }) : target[prop]
  })
})
const dialog: { shown?: any } = {}
jest.mock('components/IdeaDialog', () => ({
  __esModule: true,
  default: class {
    public submit = () => undefined
    public show() {
      dialog.shown = this
      return Promise.resolve()
    }
  }
}))
// The hub data service the command set has made for usage statistics: none, so that nothing is
// counted, until a test of what is counted sets the telemetry fixtures' stand-in.
const mockPortal: { current: any } = { current: undefined }
jest.mock('pp365-shared-library/lib/services/PortalDataService', () => ({
  PortalDataService: class {
    public configure() {
      return Promise.resolve(mockPortal.current)
    }
  }
}))

import strings from 'PortfolioExtensionsStrings'
import {
  hubPortal,
  ITelemetryTestBed,
  settingsMap,
  telemetryTestBed
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import resource from 'SharedResources'
import IdeaProjectDataCommand from '.'
import {
  HUB,
  PROCESSING_LIST,
  USER,
  commandSetContext,
  execute,
  fakeSp,
  ideaConfiguration,
  ignoreNavigation,
  manifestAlias,
  row,
  settle
} from '../testFixtures'

const OPEN = 'OPEN_IDEA_PROJECTDATA_DIALOG'
const IDEA = row({ ID: 7, Title: 'Ny bysykkel', GtIdeaDecision: 'Godkjent' })
const ALIAS = manifestAlias('ideaProjectData')

/**
 * The command set on `listTitle`, initialised and told the list view changed. With `telemetry`
 * its context is a page on the hub as usage statistics read it.
 */
async function projectDataCommand({
  listTitle = PROCESSING_LIST,
  selectedRows = [IDEA],
  processors = [{ Email: USER }],
  telemetry = false
} = {}) {
  const fake = fakeSp(
    { [resource.Lists_Idea_Configuration_Title]: [ideaConfiguration()] },
    { [resource.Security_SiteGroup_IdeaProcessors_Title]: processors }
  )
  mockSp.current = fake.sp
  const { context, changed } = commandSetContext({
    listTitle,
    selectedRows,
    telemetry: telemetry ? { alias: ALIAS } : undefined
  })
  const command = new IdeaProjectDataCommand()
  ;(command as any).context = context
  await command.onInit()
  await changed()
  // The hub's level is read in the background, as the command set starts.
  await settle()
  return { command, fake, open: command.tryGetCommand(OPEN) }
}

let navigation: jest.SpyInstance

beforeEach(() => {
  dialog.shown = undefined
  navigation = ignoreNavigation()
})

afterEach(() => navigation.mockRestore())

describe('IdeaProjectDataCommand', () => {
  it('shows the command to idea processors with one idea selected on the processing list', async () => {
    const { open } = await projectDataCommand()
    expect(open.title).toBe(strings.IdeaProjectDataCommandTitle)
    expect(open.visible).toBe(true)
  })

  it.each([
    ['no idea is selected', { selectedRows: [] }],
    ['the user is not an idea processor', { processors: [] }],
    ['the list has no idea configuration', { listTitle: 'Dokumenter' }]
  ])('hides the command when %s', async (_, options) => {
    const { open } = await projectDataCommand(options)
    expect(open.visible).toBe(false)
  })

  it.each([
    ['approved', 'Godkjent', true],
    ['approved and synchronised', strings.ApprovedSyncText, true],
    ['rejected', 'Avvist', false]
  ])('tells the dialog whether a %s idea may get project data', async (_, decision, approved) => {
    const { command } = await projectDataCommand()
    command.onExecute(execute(OPEN, row({ ID: 7, Title: 'Ny bysykkel', GtIdeaDecision: decision })))
    expect(dialog.shown.ideaTitle).toBe('Ny bysykkel')
    expect(dialog.shown.dialogMessage).toBe('Opprett prosjektdata for ideen.')
    expect(dialog.shown.isApproved).toBe(approved)
    expect(dialog.shown.isBlocked).toBe(false)
  })

  it('blocks a second set of project data for the same idea', async () => {
    const { command } = await projectDataCommand()
    command.onExecute(
      execute(OPEN, row({ ID: 7, GtIdeaDecision: 'Godkjent', GtIdeaProjectData: 3 }))
    )
    expect(dialog.shown.isBlocked).toBe(true)
  })

  it('creates the project data, links the idea to it and opens its edit form', async () => {
    const { command, fake } = await projectDataCommand()
    command.onExecute(execute(OPEN, IDEA))
    await dialog.shown.submit()
    expect(fake.adds).toEqual([
      {
        list: resource.Lists_ProjectData_Title,
        properties: { Title: 'Ny bysykkel', GtProjectFinanceName: 'Ny bysykkel' }
      }
    ])
    expect(fake.updates).toEqual([
      { list: PROCESSING_LIST, id: 7, properties: { GtIdeaProjectDataId: 101 } }
    ])
    expect(navigation).toHaveBeenCalled()
  })

  it('opens the edit form with a way back to the list', async () => {
    const { command } = await projectDataCommand()
    expect(command.editFormUrl({ Id: 101 })).toBe(
      `${HUB}/${resource.Lists_ProjectData_Url}/EditForm.aspx?ID=101&Source=${encodeURIComponent(
        window.location.href
      )}`
    )
  })

  it('refuses a command it does not know', async () => {
    const { command } = await projectDataCommand()
    expect(() => command.onExecute(execute('ANNEN'))).toThrow('Unknown command')
  })
})

/**
 * What the command set counts for usage statistics, on the hub: that project data was created
 * for an idea, sent before the page is left for the edit form. The window's `fetch` is the test
 * bed's, and records the batches.
 */
describe('IdeaProjectDataCommand, usage statistics', () => {
  let bed: ITelemetryTestBed

  /** The usage entries sent so far. */
  const usageSent = () => bed.batches().flatMap((batch) => batch.usage ?? [])

  beforeEach(() => {
    bed = telemetryTestBed()
    mockPortal.current = hubPortal(settingsMap('2'))
  })

  afterEach(() => {
    mockPortal.current = undefined
    bed.restore()
  })

  it('counts the project data it created, and sends the count before it leaves the page', async () => {
    const { command, fake } = await projectDataCommand({ telemetry: true })
    command.onExecute(execute(OPEN, IDEA))
    await dialog.shown.submit()
    expect(fake.adds).toHaveLength(1)
    expect(usageSent()).toEqual([{ c: ALIAS, e: 'idea.projectDataCreated', s: 'hub', n: 1 }])
    // Leaving for the edit form is what jsdom reports as navigation; the batch went out first.
    expect(navigation).toHaveBeenCalled()
    expect(bed.fetch.mock.invocationCallOrder[0]).toBeLessThan(
      navigation.mock.invocationCallOrder[0]
    )
    // The idea's title stays on the page.
    expect(JSON.stringify(bed.batches())).not.toContain('bysykkel')
  })

  it('counts nothing while the dialog is only shown', async () => {
    const { command } = await projectDataCommand({ telemetry: true })
    command.onExecute(execute(OPEN, IDEA))
    bed.leave()
    expect(usageSent()).toEqual([])
  })

  it('counts nothing when the project data could not be created', async () => {
    const { command, fake } = await projectDataCommand({ telemetry: true })
    const getByTitle = fake.sp.web.lists.getByTitle
    fake.sp.web.lists.getByTitle = (title: string) =>
      title === resource.Lists_ProjectData_Title
        ? { items: { add: () => Promise.reject(new Error('Listen finnes ikke')) } }
        : getByTitle(title)
    command.onExecute(execute(OPEN, IDEA))
    await expect(dialog.shown.submit()).rejects.toThrow('Listen finnes ikke')
    bed.leave()
    expect(usageSent()).toEqual([])
    expect(navigation).not.toHaveBeenCalled()
  })
})
