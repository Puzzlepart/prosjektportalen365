// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Every `@pnp/*` import maps to the one PnP stub, so this mock is
// all of them in this file: it keeps the stub and only lets `spfi()` hand out the test's
// stand-in. The recommendation dialog has its own test; here it answers with `dialog.answer`.
const mockSp: { current: any } = { current: undefined }
jest.mock('@pnp/sp', () => {
  const stub = jest.requireActual('@pnp/sp')
  return new Proxy(stub, {
    get: (target, prop) =>
      prop === 'spfi' ? () => ({ using: () => mockSp.current }) : target[prop]
  })
})
const dialog: { answer: { choice?: string; comment?: string }; shown?: any } = { answer: {} }
jest.mock('components/IdeaApprovalDialog', () => ({
  __esModule: true,
  default: class {
    public selectedChoice: string
    public comment: string
    public show() {
      dialog.shown = this
      this.selectedChoice = dialog.answer.choice
      this.comment = dialog.answer.comment
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
import IdeaProcessCommand from '.'
import {
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

const OPEN = 'OPEN_IDEA_PROCESSING_DIALOG'
const IDEA = row({ ID: 7, Title: 'Ny bysykkel' })
const ALIAS = manifestAlias('ideaProcessing')

/**
 * The command set on `listTitle`, initialised and told the list view changed. With `telemetry`
 * its context is a page on the hub as usage statistics read it.
 */
async function processingCommand({
  listTitle = PROCESSING_LIST,
  selectedRows = [IDEA],
  processors = [{ Email: USER }],
  configuration = ideaConfiguration(),
  telemetry = false
} = {}) {
  const fake = fakeSp(
    { [resource.Lists_Idea_Configuration_Title]: [configuration] },
    { [resource.Security_SiteGroup_IdeaProcessors_Title]: processors }
  )
  mockSp.current = fake.sp
  const { context, changed } = commandSetContext({
    listTitle,
    selectedRows,
    telemetry: telemetry ? { alias: ALIAS } : undefined
  })
  const command = new IdeaProcessCommand()
  ;(command as any).context = context
  const raiseOnChange = jest.spyOn(command, 'raiseOnChange')
  await command.onInit()
  await changed()
  // The hub's level is read in the background, as the command set starts.
  await settle()
  return { command, fake, raiseOnChange, open: command.tryGetCommand(OPEN) }
}

let navigation: jest.SpyInstance

beforeEach(() => {
  dialog.answer = {}
  dialog.shown = undefined
  navigation = ignoreNavigation()
})

afterEach(() => navigation.mockRestore())

describe('IdeaProcessCommand', () => {
  it('shows the command to idea processors with one idea selected on the processing list', async () => {
    const { open, raiseOnChange } = await processingCommand()
    expect(open.title).toBe(strings.IdeaProcessingCommandTitle)
    expect(open.iconImageUrl).toMatch(/^data:image\/svg\+xml,/)
    expect(open.visible).toBe(true)
    expect(raiseOnChange).toHaveBeenCalled()
  })

  it.each([
    ['no idea is selected', { selectedRows: [] }],
    ['two ideas are selected', { selectedRows: [IDEA, row({ ID: 8 })] }],
    ['the user is not an idea processor', { processors: [{ Email: 'ola@contoso.no' }] }]
  ])('hides the command when %s', async (_, options) => {
    const { open } = await processingCommand(options)
    expect(open.visible).toBe(false)
  })

  it('leaves a list without an idea configuration alone', async () => {
    const { open, raiseOnChange } = await processingCommand({ listTitle: 'Dokumenter' })
    expect(open.visible).toBe(false)
    expect(raiseOnChange).not.toHaveBeenCalled()
  })

  it('asks for the decision with the configured message and choices', async () => {
    const { command } = await processingCommand()
    await command.onExecute(execute(OPEN, IDEA))
    expect(dialog.shown.ideaTitle).toBe('Ny bysykkel')
    expect(dialog.shown.dialogMessage).toBe('Behandle ideen.')
    expect(dialog.shown.choices.map(({ choice }) => choice)).toEqual([
      'Godkjenn',
      'Vurder',
      'Avvis',
      'Prøv ut'
    ])
  })

  it.each([
    ['Godkjenn', 'Godkjent'],
    ['Vurder', 'Under vurdering'],
    ['Avvis', 'Avvist'],
    ['Prøv ut', 'Pilot']
  ])('records the decision for "%s" with the comment', async (choice, decision) => {
    const { command, fake } = await processingCommand()
    dialog.answer = { choice, comment: 'Vurdert i porteføljerådet' }
    await command.onExecute(execute(OPEN, IDEA))
    await settle()
    expect(fake.updates).toEqual([
      {
        list: PROCESSING_LIST,
        id: 7,
        properties: { GtIdeaDecision: decision, GtIdeaDecisionComment: 'Vurdert i porteføljerådet' }
      }
    ])
  })

  it('says so instead when the idea is already approved', async () => {
    const alert = jest.spyOn(Dialog, 'alert')
    const { command, fake } = await processingCommand()
    dialog.answer = { choice: 'Avvis', comment: 'Likevel ikke' }
    await command.onExecute(execute(OPEN, row({ ID: 7, Title: 'X', GtIdeaDecision: 'Godkjent' })))
    await settle()
    expect(alert).toHaveBeenCalledWith(strings.IdeaAlreadyApproved)
    expect(fake.updates).toEqual([])
    alert.mockRestore()
  })

  it('records nothing when the dialog closes without a comment or a known choice', async () => {
    const { command, fake } = await processingCommand()
    dialog.answer = { choice: 'Godkjenn' }
    await command.onExecute(execute(OPEN, IDEA))
    dialog.answer = { choice: 'Ukjent', comment: 'Hva nå?' }
    await command.onExecute(execute(OPEN, IDEA))
    await settle()
    expect(fake.updates).toEqual([])
  })

  it('refuses a command it does not know', async () => {
    const { command } = await processingCommand()
    await expect(command.onExecute(execute('ANNEN'))).rejects.toThrow('Unknown command')
  })
})

/**
 * What the command set counts for usage statistics, on a hub at Standard: a decision, by the kind
 * of choice, sent before the page reloads. The window's `fetch` is the test bed's, and records
 * the batches.
 */
describe('IdeaProcessCommand, usage statistics', () => {
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

  it.each([
    ['Godkjenn', 'approve'],
    ['Vurder', 'consider'],
    ['Avvis', 'reject'],
    ['Prøv ut', 'other']
  ])('counts the decision "%s" as %s, and sends it before the page reloads', async (choice, v) => {
    const alert = jest.spyOn(Dialog, 'alert')
    const { command, fake } = await processingCommand({ telemetry: true })
    dialog.answer = { choice, comment: 'Vurdert i porteføljerådet' }
    await command.onExecute(execute(OPEN, IDEA))
    await settle()
    expect(alert).not.toHaveBeenCalled()
    expect(fake.updates).toHaveLength(1)
    expect(usageSent()).toEqual([{ c: ALIAS, e: 'idea.decided', s: 'hub', v, n: 1 }])
    // The reload is what jsdom reports as navigation; the batch went out before it.
    expect(navigation).toHaveBeenCalled()
    expect(bed.fetch.mock.invocationCallOrder[0]).toBeLessThan(
      navigation.mock.invocationCallOrder[0]
    )
  })

  it('counts by the key of the choice in the configuration, whatever the choice is called', async () => {
    const configuration = ideaConfiguration({
      GtIdeaProcessingChoices: JSON.stringify({
        approve: { choice: 'Vi kjører på', recommendation: 'Klarsignal' },
        reject: { choice: 'Approve', recommendation: 'Nei' }
      })
    })
    const { command } = await processingCommand({ telemetry: true, configuration })
    dialog.answer = { choice: 'Vi kjører på', comment: 'Ja' }
    await command.onExecute(execute(OPEN, IDEA))
    dialog.answer = { choice: 'Approve', comment: 'Nei' }
    await command.onExecute(execute(OPEN, IDEA))
    await settle()
    expect(usageSent().map(({ v }) => v)).toEqual(['approve', 'reject'])
    // The names of the choices and what was written about the idea stay on the page.
    expect(JSON.stringify(bed.batches())).not.toMatch(/kjører|Klarsignal|bysykkel/)
  })

  it('counts nothing when no decision is recorded', async () => {
    const { command, fake } = await processingCommand({ telemetry: true })
    // No comment, a choice the configuration does not have, and an idea that is already approved.
    dialog.answer = { choice: 'Godkjenn' }
    await command.onExecute(execute(OPEN, IDEA))
    dialog.answer = { choice: 'Ukjent', comment: 'Hva nå?' }
    await command.onExecute(execute(OPEN, IDEA))
    dialog.answer = { choice: 'Avvis', comment: 'Likevel ikke' }
    await command.onExecute(execute(OPEN, row({ ID: 7, Title: 'X', GtIdeaDecision: 'Godkjent' })))
    await settle()
    bed.leave()
    expect(fake.updates).toEqual([])
    expect(usageSent()).toEqual([])
  })

  it('sends nothing from a hub with usage statistics off', async () => {
    mockPortal.current = hubPortal(settingsMap('0'))
    const { command, fake } = await processingCommand({ telemetry: true })
    dialog.answer = { choice: 'Godkjenn', comment: 'Ja' }
    await command.onExecute(execute(OPEN, IDEA))
    await settle()
    bed.leave()
    expect(fake.updates).toHaveLength(1)
    expect(bed.fetch).not.toHaveBeenCalled()
  })
})

/**
 * A decision that is not saved, on a hub at Utvidet, where failures are counted. The dialog is
 * closed by the time the save runs, so the user is told in an alert; the failure is counted once,
 * by the error's code; and nothing is counted as decided, nor is the page reloaded.
 */
describe('IdeaProcessCommand, a decision that is not saved', () => {
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

  it.each([['Godkjenn'], ['Vurder'], ['Avvis'], ['Prøv ut']])(
    'tells the user that the decision "%s" was not saved, and counts the failure by its code',
    async (choice) => {
      const { command, fake } = await processingCommand({ telemetry: true })
      fake.fail(PROCESSING_LIST, 'update', httpError(403, 'Ingen tilgang til «Ny bysykkel»'))
      dialog.answer = { choice, comment: 'Vurdert i porteføljerådet' }
      await command.onExecute(execute(OPEN, IDEA))
      await settle()
      expect(alert.mock.calls).toEqual([[strings.IdeaRecommendationSaveErrorMessage]])
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
      expect(JSON.stringify(bed.batches())).not.toMatch(/tilgang|bysykkel|porteføljerådet/)
    }
  )

  it('counts a failure without a status as unknown, whatever its message says', async () => {
    const { command, fake } = await processingCommand({ telemetry: true })
    fake.fail(PROCESSING_LIST, 'update', new Error('404 Not Found: «Ny bysykkel»'))
    dialog.answer = { choice: 'Godkjenn', comment: 'Vurdert i porteføljerådet' }
    await command.onExecute(execute(OPEN, IDEA))
    await settle()
    expect(alert.mock.calls).toEqual([[strings.IdeaRecommendationSaveErrorMessage]])
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} unknown`]: 1 })
    expect(countedTelemetry().usage).toEqual({})
    expect(navigation).not.toHaveBeenCalled()
  })

  it('records the decision when the user sends it once more after a failure', async () => {
    const { command, fake } = await processingCommand({ telemetry: true })
    fake.fail(PROCESSING_LIST, 'update', httpError(503, 'Tjenesten er opptatt'))
    dialog.answer = { choice: 'Avvis', comment: 'For dyrt' }
    await command.onExecute(execute(OPEN, IDEA))
    await settle()
    fake.fail(PROCESSING_LIST, 'update')
    await command.onExecute(execute(OPEN, IDEA))
    await settle()
    expect(alert).toHaveBeenCalledTimes(1)
    expect(fake.updates).toHaveLength(1)
    expect(sent().usage).toEqual([{ c: ALIAS, e: 'idea.decided', s: 'hub', v: 'reject', n: 1 }])
    expect(navigation).toHaveBeenCalled()
  })
})
