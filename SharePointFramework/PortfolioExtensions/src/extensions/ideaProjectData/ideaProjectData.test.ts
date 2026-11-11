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

import strings from 'PortfolioExtensionsStrings'
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
  row
} from '../testFixtures'

const OPEN = 'OPEN_IDEA_PROJECTDATA_DIALOG'
const IDEA = row({ ID: 7, Title: 'Ny bysykkel', GtIdeaDecision: 'Godkjent' })

/** The command set on `listTitle`, initialised and told the list view changed. */
async function projectDataCommand({
  listTitle = PROCESSING_LIST,
  selectedRows = [IDEA],
  processors = [{ Email: USER }]
} = {}) {
  const fake = fakeSp(
    { [resource.Lists_Idea_Configuration_Title]: [ideaConfiguration()] },
    { [resource.Security_SiteGroup_IdeaProcessors_Title]: processors }
  )
  mockSp.current = fake.sp
  const { context, changed } = commandSetContext({ listTitle, selectedRows })
  const command = new IdeaProjectDataCommand()
  ;(command as any).context = context
  await command.onInit()
  await changed()
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
