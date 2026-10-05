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

import { Dialog } from '@microsoft/sp-dialog'
import strings from 'PortfolioExtensionsStrings'
import resource from 'SharedResources'
import IdeaProcessCommand from '.'
import {
  PROCESSING_LIST,
  USER,
  commandSetContext,
  execute,
  fakeSp,
  ideaConfiguration,
  ignoreNavigation,
  row,
  settle
} from '../testFixtures'

const OPEN = 'OPEN_IDEA_PROCESSING_DIALOG'
const IDEA = row({ ID: 7, Title: 'Ny bysykkel' })

/** The command set on `listTitle`, initialised and told the list view changed. */
async function processingCommand({
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
  const command = new IdeaProcessCommand()
  ;(command as any).context = context
  const raiseOnChange = jest.spyOn(command, 'raiseOnChange')
  await command.onInit()
  await changed()
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
