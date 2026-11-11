// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Every `@pnp/*` import maps to the one PnP stub, so this mock is
// all of them in this file: it keeps the stub and only lets `spfi()` hand out the test's
// stand-in. The recommendation dialog has its own test; here it answers with `dialog.answer`.
// The portal data service answers the processing list's fields with `portal.fields`.
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
const portal: { fields: any[]; requests: any[][] } = { fields: [], requests: [] }
jest.mock('pp365-shared-library/lib/services/PortalDataService', () => ({
  PortalDataService: class {
    public configure() {
      return Promise.resolve(this)
    }
    public getListFields(...args: any[]) {
      portal.requests.push(args)
      return Promise.resolve(portal.fields)
    }
  }
}))

import { Dialog } from '@microsoft/sp-dialog'
import strings from 'PortfolioExtensionsStrings'
import resource from 'SharedResources'
import IdeaRegistrationCommand from '.'
import {
  HUB,
  PROCESSING_LIST,
  REGISTRATION_LIST,
  USER,
  commandSetContext,
  execute,
  fakeSp,
  ideaConfiguration,
  ignoreNavigation,
  row,
  settle
} from '../testFixtures'

const OPEN = 'OPEN_IDEA_REGISTRATION_DIALOG'
const LINK = 'IDEA_PROCESSING_LINK'

const FIELDS = [
  { internalName: 'ID', displayName: 'ID', fieldType: 'Counter' },
  { internalName: 'Title', displayName: 'Tittel', fieldType: 'Text' },
  { internalName: 'GtIdeaOwner', displayName: 'Ideeier', fieldType: 'User' },
  { internalName: 'GtIdeaGain', displayName: 'Gevinst', fieldType: 'Note' },
  { internalName: 'GtIdeaCost', displayName: 'Kostnad', fieldType: 'Currency' }
]
const IDEA = row(
  {
    ID: 7,
    Title: 'Ny bysykkel',
    GtIdeaOwner: [{ id: 12, title: 'Kari Nordmann' }],
    GtIdeaGain: 'Færre biler i sentrum',
    GtIdeaCost: 250000
  },
  FIELDS
)

/** The columns of the project content columns list: which fields an approved idea carries over. */
const CONTENT_COLUMNS = [
  {
    GtInternalName: 'GtIdeaOwner',
    GtManagedProperty: 'GtIdeaOwnerOWSUSER',
    GtDataSourceCategory: resource.Lists_DataSources_Category_IdeaModule,
    GtIdeaCopyToProcess: true
  },
  {
    GtInternalName: 'GtIdeaGain',
    GtDataSourceLevel: [resource.Lists_DataSources_Level_Portfolio],
    GtIdeaCopyToProcess: true
  },
  // Another category's column, and one that is not to be carried over.
  { GtInternalName: 'GtIdeaCost', GtDataSourceCategory: 'Prosjekter', GtIdeaCopyToProcess: true },
  { GtInternalName: 'Title', GtIdeaCopyToProcess: false }
]

/** The command set on `listTitle`, initialised and told the list view changed. */
async function registrationCommand({
  listTitle = REGISTRATION_LIST,
  selectedRows = [IDEA],
  processors = [{ Email: USER }]
} = {}) {
  const fake = fakeSp(
    {
      [resource.Lists_Idea_Configuration_Title]: [ideaConfiguration()],
      [resource.Lists_ProjectContentColumns_Title]: CONTENT_COLUMNS
    },
    { [resource.Security_SiteGroup_IdeaProcessors_Title]: processors }
  )
  mockSp.current = fake.sp
  const { context, changed } = commandSetContext({ listTitle, selectedRows })
  const command = new IdeaRegistrationCommand()
  ;(command as any).context = context
  await command.onInit()
  await changed()
  return {
    command,
    fake,
    open: command.tryGetCommand(OPEN),
    link: command.tryGetCommand(LINK)
  }
}

let navigation: jest.SpyInstance

beforeEach(() => {
  dialog.answer = {}
  dialog.shown = undefined
  portal.fields = [
    { InternalName: 'Title', Title: 'Tittel' },
    { InternalName: 'GtIdeaOwner', Title: 'Ideeier' },
    { InternalName: 'GtIdeaGain', Title: 'Gevinst' },
    { InternalName: 'GtIdeaCost', Title: 'Kostnad' }
  ]
  portal.requests = []
  navigation = ignoreNavigation()
})

afterEach(() => navigation.mockRestore())

describe('IdeaRegistrationCommand', () => {
  it('shows the recommendation to idea processors with one idea selected, and the way to the processing list', async () => {
    const { open, link } = await registrationCommand()
    expect(open.title).toBe(strings.IdeaRegistrationCommandTitle)
    expect(open.visible).toBe(true)
    expect(link.title).toBe(strings.IdeaProcessingLinkTitle)
    expect(link.visible).toBe(true)
  })

  it('hides both on a list that is not a registration list', async () => {
    const { open, link } = await registrationCommand({ listTitle: 'Dokumenter' })
    expect(open.visible).toBe(false)
    expect(link.visible).toBe(false)
  })

  it.each([
    ['no idea is selected', { selectedRows: [] }],
    ['the user is not an idea processor', { processors: [] }]
  ])('hides the recommendation when %s', async (_, options) => {
    const { open } = await registrationCommand(options)
    expect(open.visible).toBe(false)
  })

  it('asks for the recommendation with the configured message and choices', async () => {
    const { command } = await registrationCommand()
    await command.onExecute(execute(OPEN, IDEA))
    expect(dialog.shown.ideaTitle).toBe('Ny bysykkel')
    expect(dialog.shown.dialogMessage).toBe('Anbefal ideen.')
    expect(dialog.shown.choices).toHaveLength(4)
  })

  it.each([
    ['Vurder', 'Under vurdering'],
    ['Avvis', 'Avvist'],
    ['Prøv ut', 'Pilot']
  ])('records the recommendation for "%s" with the comment', async (choice, recommendation) => {
    const { command, fake } = await registrationCommand()
    dialog.answer = { choice, comment: 'Trenger mer underlag' }
    await command.onExecute(execute(OPEN, IDEA))
    await settle()
    expect(fake.updates).toEqual([
      {
        list: REGISTRATION_LIST,
        id: 7,
        properties: {
          GtIdeaRecommendation: recommendation,
          GtIdeaRecommendationComment: 'Trenger mer underlag'
        }
      }
    ])
    expect(fake.adds).toEqual([])
  })

  it('sends an approved idea on to processing with the fields the content columns name', async () => {
    const { command, fake } = await registrationCommand()
    dialog.answer = { choice: 'Godkjenn', comment: 'Passer med strategien' }
    await command.onExecute(execute(OPEN, IDEA))
    await settle()
    expect(portal.requests).toEqual([
      [PROCESSING_LIST, "substringof('Gt', InternalName) or InternalName eq 'Title'", fake.sp.web]
    ])
    expect(fake.updates).toEqual([
      {
        list: REGISTRATION_LIST,
        id: 7,
        properties: {
          GtIdeaRecommendation: 'Godkjent',
          GtIdeaRecommendationComment: 'Passer med strategien'
        }
      }
    ])
    expect(fake.adds).toEqual([
      {
        list: PROCESSING_LIST,
        properties: {
          GtRegistratedIdeaId: 7,
          GtIdeaUrl: `${HUB}/SitePages/${resource.ClientSidePages_IdeaModule_PageName}#ideaId=7`,
          GtIdeaOwnerId: 12,
          GtIdeaGain: 'Færre biler i sentrum'
        }
      }
    ])
  })

  it('says so instead when the idea is already recommended for approval', async () => {
    const alert = jest.spyOn(Dialog, 'alert')
    const { command, fake } = await registrationCommand()
    dialog.answer = { choice: 'Avvis', comment: 'Likevel ikke' }
    await command.onExecute(
      execute(OPEN, row({ ID: 7, Title: 'X', GtIdeaRecommendation: 'Godkjent' }, FIELDS))
    )
    await settle()
    expect(alert).toHaveBeenCalledWith(strings.IdeaAlreadyApproved)
    expect(fake.updates).toEqual([])
    alert.mockRestore()
  })

  it('opens the processing list of the configuration', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null)
    const { command } = await registrationCommand()
    await command.onExecute(execute(LINK))
    expect(open).toHaveBeenCalledWith(`/sites/pp365/Lists/${PROCESSING_LIST}`, '_blank')
    open.mockRestore()
  })

  it('tells the user when the list has no processing list configured', async () => {
    const alert = jest.spyOn(window, 'alert').mockImplementation(() => undefined)
    const { command } = await registrationCommand({ listTitle: 'Gamle registreringer' })
    await expect(command.onExecute(execute(LINK))).rejects.toThrow()
    expect(alert).toHaveBeenCalledWith(strings.IdeaProcessingListErrorMessage)
    alert.mockRestore()
  })

  it('refuses a command it does not know', async () => {
    const { command } = await registrationCommand()
    await expect(command.onExecute(execute('ANNEN'))).rejects.toThrow('Unknown command')
  })
})
