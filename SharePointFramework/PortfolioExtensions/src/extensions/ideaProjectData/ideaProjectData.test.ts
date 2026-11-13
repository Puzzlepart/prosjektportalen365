// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Every `@pnp/*` import maps to the one PnP stub, so this mock is
// all of them in this file: it keeps the stub and only lets `spfi()` hand out the test's
// stand-in. The project data dialog has its own test; here it records what it was shown with,
// and every error message it was given or had taken away (`errors`), and stays open once shown.
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
    public isOpen = false
    public errors: (string | undefined)[] = []
    public show() {
      dialog.shown = this
      this.isOpen = true
      return Promise.resolve()
    }
    public setErrorMessage(message?: string) {
      this.errors.push(message)
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

import { Dialog } from '@microsoft/sp-dialog'
import strings from 'PortfolioExtensionsStrings'
import {
  countedTelemetry,
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
  httpError,
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
    expect(dialog.shown.errors).toEqual([undefined])
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
    fake.fail(resource.Lists_ProjectData_Title, 'add', new Error('Listen finnes ikke'))
    command.onExecute(execute(OPEN, IDEA))
    await dialog.shown.submit()
    bed.leave()
    expect(usageSent()).toEqual([])
    expect(navigation).not.toHaveBeenCalled()
  })
})

/**
 * Project data that is not created, on a hub at Utvidet, where failures are counted. The dialog
 * is still open, so the user is told there and may try again; the failure is counted once, by the
 * error's code; and nothing is counted as created, nor is the page left for the edit form.
 */
describe('IdeaProjectDataCommand, project data that is not created', () => {
  let bed: ITelemetryTestBed
  let alert: jest.SpyInstance

  /** The usage and error entries sent so far. */
  const sent = () => ({
    usage: bed.batches().flatMap((batch) => batch.usage ?? []),
    errors: bed.batches().flatMap((batch) => batch.errors ?? [])
  })

  beforeEach(() => {
    bed = telemetryTestBed()
    mockPortal.current = hubPortal(settingsMap('3'))
    alert = jest.spyOn(Dialog, 'alert')
  })

  afterEach(() => {
    mockPortal.current = undefined
    bed.restore()
  })

  it('tells the user in the open dialog, and counts the failure by its code', async () => {
    const { command, fake } = await projectDataCommand({ telemetry: true })
    fake.fail(
      resource.Lists_ProjectData_Title,
      'add',
      httpError(403, 'Ingen tilgang til «Ny bysykkel»')
    )
    command.onExecute(execute(OPEN, IDEA))
    await dialog.shown.submit()
    expect(dialog.shown.errors).toEqual([undefined, strings.IdeaProjectDataSaveErrorMessage])
    expect(dialog.shown.isOpen).toBe(true)
    expect(alert).not.toHaveBeenCalled()
    expect(fake.adds).toEqual([])
    expect(fake.updates).toEqual([])
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} permission_denied 403`]: 1 })
    expect(countedTelemetry().usage).toEqual({})
    expect(navigation).not.toHaveBeenCalled()
    // What leaves the page with the user: the code and the status, never the error's message.
    bed.leave()
    expect(sent()).toEqual({
      usage: [],
      errors: [{ c: ALIAS, code: 'permission_denied', http: 403, n: 1 }]
    })
    expect(JSON.stringify(bed.batches())).not.toMatch(/tilgang|bysykkel/)
  })

  it('does not report project data as created when the idea could not be linked to it', async () => {
    const { command, fake } = await projectDataCommand({ telemetry: true })
    fake.fail(PROCESSING_LIST, 'update', httpError(500, 'Kunne ikke lagre «Ny bysykkel»'))
    command.onExecute(execute(OPEN, IDEA))
    await dialog.shown.submit()
    // Left behind, as nothing is rolled back: the project data, which no idea points to.
    expect(fake.adds).toHaveLength(1)
    expect(fake.updates).toEqual([])
    expect(dialog.shown.errors).toEqual([undefined, strings.IdeaProjectDataSaveErrorMessage])
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} server_error 500`]: 1 })
    expect(countedTelemetry().usage).toEqual({})
    expect(navigation).not.toHaveBeenCalled()
  })

  it('links the project data it created when the user tries again, and creates no second', async () => {
    const { command, fake } = await projectDataCommand({ telemetry: true })
    fake.fail(PROCESSING_LIST, 'update', httpError(500, 'Kunne ikke lagre «Ny bysykkel»'))
    command.onExecute(execute(OPEN, IDEA))
    await dialog.shown.submit()
    fake.fail(PROCESSING_LIST, 'update')
    await dialog.shown.submit()
    expect(fake.adds).toHaveLength(1)
    expect(fake.updates).toEqual([
      { list: PROCESSING_LIST, id: 7, properties: { GtIdeaProjectDataId: 101 } }
    ])
    expect(sent()).toEqual({
      usage: [{ c: ALIAS, e: 'idea.projectDataCreated', s: 'hub', n: 1 }],
      errors: [{ c: ALIAS, code: 'server_error', http: 500, n: 1 }]
    })
    expect(navigation).toHaveBeenCalled()
  })

  it('takes the error away and creates the project data when the user tries again', async () => {
    const { command, fake } = await projectDataCommand({ telemetry: true })
    fake.fail(resource.Lists_ProjectData_Title, 'add', httpError(503, 'Tjenesten er opptatt'))
    command.onExecute(execute(OPEN, IDEA))
    await dialog.shown.submit()
    fake.fail(resource.Lists_ProjectData_Title, 'add')
    await dialog.shown.submit()
    expect(dialog.shown.errors).toEqual([
      undefined,
      strings.IdeaProjectDataSaveErrorMessage,
      undefined
    ])
    expect(fake.adds).toHaveLength(1)
    expect(sent().usage).toEqual([{ c: ALIAS, e: 'idea.projectDataCreated', s: 'hub', n: 1 }])
    expect(navigation).toHaveBeenCalled()
  })

  it('tells the user in an alert when the dialog was closed while the project data was created', async () => {
    const { command, fake } = await projectDataCommand({ telemetry: true })
    fake.fail(resource.Lists_ProjectData_Title, 'add', httpError(403, 'Ingen tilgang'))
    command.onExecute(execute(OPEN, IDEA))
    const created = dialog.shown.submit()
    dialog.shown.isOpen = false
    await created
    expect(alert.mock.calls).toEqual([[strings.IdeaProjectDataSaveErrorMessage]])
    expect(dialog.shown.errors).toEqual([undefined])
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} permission_denied 403`]: 1 })
    expect(navigation).not.toHaveBeenCalled()
  })
})
