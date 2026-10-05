import strings from 'SharedLibraryStrings'
import { ProjectPhaseModel } from '../../models'
import { format } from '../../util'
import { ProjectDataService } from './ProjectDataService'

/**
 * A project's properties live in the one item of its own properties list, with the project's
 * entity in the hub as the fallback. The project site is a structural stand-in for the PnPjs calls
 * the service makes; the hub's entity service is a plain object.
 */
const WEB_URL = 'https://contoso.sharepoint.com/sites/frisbee'
const SITE_ID = 'a1b2c3d4-0000-4000-8000-000000000002'
const LIST_ID = 'b2f3c4d5-0000-4000-8000-000000000001'
const TEMPLATE_PARAMETERS = '{"ProjectContentTypeId":"0x0100805E9E4FEAAB4F0EABAB2600D30DB70C"}'

const VALUES = {
  Id: 1,
  Title: 'Frisbeegolfbane',
  GtProjectPhase: { Label: 'Gjennomføring', TermGuid: 'term-3', WssId: 4 },
  GtProjectManager: { Id: 12, Title: 'Kari Nordmann', EMail: 'kari@contoso.no' },
  TemplateParameters: TEMPLATE_PARAMETERS
}
const TEXT = {
  Title: 'Frisbeegolfbane',
  GtProjectPhase: 'Gjennomføring',
  GtProjectManager: 'Kari Nordmann',
  TemplateParameters: TEMPLATE_PARAMETERS
}
const FIELDS = [
  { InternalName: 'GtProjectPhase', TypeAsString: 'TaxonomyFieldType', SchemaXml: '<Field />' },
  {
    InternalName: 'GtProjectManager',
    TypeAsString: 'User',
    SchemaXml: '<Field ShowInEditForm="FALSE" />'
  }
]

interface IProject {
  /** Whether the site has the properties list. */
  hasList?: boolean
  /** Whether the list has its one item (`VALUES`). */
  hasItem?: boolean
  checklist?: Record<string, any>[] | Error
  welcomePage?: string | Error
}

/** The project site, recording the list lookups, item reads and item updates. */
function projectSite({
  hasList = true,
  hasItem = true,
  checklist = [],
  welcomePage = 'SitePages/Hjem.aspx'
}: IProject) {
  const lookups: string[] = []
  const reads: { fields: string[]; expand: string[] }[] = []
  const updates: { list: string; id: number; properties: Record<string, any> }[] = []
  const answer = (value: unknown) =>
    value instanceof Error ? Promise.reject(value) : Promise.resolve(value)
  const item = (list: string, id: number) => ({
    fieldValuesAsText: () => Promise.resolve(TEXT),
    select: (...fields: string[]) => ({
      expand:
        (...expand: string[]) =>
        () => {
          reads.push({ fields, expand })
          return Promise.resolve(VALUES)
        }
    }),
    update: (properties: Record<string, any>) => {
      updates.push({ list, id, properties })
      return Promise.resolve()
    }
  })
  const web = {
    lists: {
      filter: (query: string) => ({
        select: () => () => {
          lookups.push(query)
          return Promise.resolve(hasList ? [{ Id: LIST_ID }] : [])
        }
      }),
      getById: (id: string) => ({
        fields: { select: () => ({ filter: () => () => Promise.resolve(FIELDS) }) },
        items: {
          select: () => ({ top: () => () => Promise.resolve(hasItem ? [{ Id: VALUES.Id }] : []) }),
          getById: (itemId: number) => item(id, itemId)
        }
      }),
      getByTitle: (title: string) => ({
        items: {
          top: () => ({ select: () => () => answer(checklist) }),
          getById: (itemId: number) => item(title, itemId)
        }
      })
    },
    rootFolder: {
      select: () => () =>
        answer(welcomePage instanceof Error ? welcomePage : { WelcomePage: welcomePage })
    }
  }
  return { web, lookups, reads, updates }
}

const ENTITY = {
  fieldValues: { Id: 7, Title: 'Frisbeegolfbane', GtProjectPhaseText: 'Konsept' },
  fields: [{ InternalName: 'GtProjectPhase' }],
  urls: {
    editFormUrl: 'https://contoso.sharepoint.com/sites/hub/Lists/Prosjekter/EditForm.aspx?ID=7',
    versionHistoryUrl: 'https://contoso.sharepoint.com/sites/hub/_layouts/15/versions.aspx?ID=7'
  }
}

/** The project's entity in the hub. */
function hub() {
  return {
    fetchEntity: jest.fn((_siteId: string, _webUrl: string) => Promise.resolve(ENTITY)),
    updateEntityItem: jest.fn((_siteId: string, _properties: Record<string, any>) =>
      Promise.resolve()
    )
  }
}

function service(site: IProject = {}, entityService: ReturnType<typeof hub> = null) {
  const stand = projectSite(site)
  const instance = new ProjectDataService({
    webUrl: WEB_URL,
    siteId: SITE_ID,
    propertiesListName: 'Prosjektegenskaper',
    entityService: entityService as any,
    spfxContext: {} as any
  })
  instance.web = stand.web as any
  return { instance, ...stand }
}

const PHASE = new ProjectPhaseModel(
  { id: 'term-4', labels: [{ name: 'Avslutning', languageTag: 'nb-NO', isDefault: true }] } as any,
  'termset-1',
  undefined
)
const PHASE_FIELD = {
  fieldName: 'GtProjectPhase',
  termSetId: 'termset-1',
  textField: 'GtProjectPhase_0'
}
const PHASE_PROPERTIES = {
  GtProjectPhase_0: '-1;#Avslutning|term-4',
  GtProjectPhaseText: 'Avslutning'
}

describe('ProjectDataService', () => {
  describe('getProjectInformationData', () => {
    it("reads the project's properties from the item in its own list", async () => {
      const { instance, lookups, reads } = service()
      const data = await instance.getProjectInformationData()
      expect(data.propertiesListId).toBe(LIST_ID)
      expect(data.fieldValues.get('GtProjectPhase', { format: 'text' })).toBe('Gjennomføring')
      expect(data.templateParameters).toEqual(JSON.parse(TEMPLATE_PARAMETERS))
      expect(data.versionHistoryUrl).toBe(
        `${WEB_URL}/_layouts/15/versions.aspx?list=${LIST_ID}&ID=1`
      )
      expect(data.fields.map((field) => [field.InternalName, field.ShowInEditForm])).toEqual([
        ['GtProjectPhase', true],
        ['GtProjectManager', false]
      ])
      // The people in the user fields are read with the item.
      expect(reads[0].expand).toEqual(['GtProjectManager'])
      expect(lookups).toEqual(["Title eq 'Prosjektegenskaper'"])
      // Where the item is, is remembered.
      await instance.getProjectInformationData()
      expect(lookups).toHaveLength(1)
    })

    it("falls back to the project's entity in the hub without an item of its own", async () => {
      for (const site of [{ hasList: false }, { hasItem: false }]) {
        const entityService = hub()
        const data = await service(site, entityService).instance.getProjectInformationData()
        expect(entityService.fetchEntity).toHaveBeenCalledWith(SITE_ID, WEB_URL)
        expect(data.fieldValues.get('Title').value).toBe('Frisbeegolfbane')
        expect(data.propertiesListId).toBeNull()
        expect(data.versionHistoryUrl).toBe(ENTITY.urls.versionHistoryUrl)
      }
    })

    it('has no properties with neither an item of its own nor a hub to ask', async () => {
      const data = await service({ hasList: false }).instance.getProjectInformationData()
      expect(data.fieldValues.keys).toEqual([])
      expect(data).toEqual(
        expect.objectContaining({ fields: [], propertiesListId: null, templateParameters: {} })
      )
    })

    it('reads the name of the current phase', async () => {
      expect(await service().instance.getCurrentPhaseName('GtProjectPhase')).toBe('Gjennomføring')
    })
  })

  describe('updateProjectPhase', () => {
    it("writes the new phase to the project's item and to its entity in the hub", async () => {
      const entityService = hub()
      const { instance, updates } = service({}, entityService)
      await instance.updateProjectPhase(PHASE, PHASE_FIELD)
      expect(updates).toEqual([{ list: LIST_ID, id: 1, properties: PHASE_PROPERTIES }])
      expect(entityService.updateEntityItem).toHaveBeenCalledWith(SITE_ID, PHASE_PROPERTIES)
    })

    it('writes the new phase to the hub alone when the project has no item of its own', async () => {
      for (const site of [{ hasList: false }, { hasItem: false }]) {
        const entityService = hub()
        const { instance, updates } = service(site, entityService)
        await instance.updateProjectPhase(PHASE, PHASE_FIELD)
        expect(updates).toEqual([])
        expect(entityService.updateEntityItem).toHaveBeenCalledWith(SITE_ID, PHASE_PROPERTIES)
      }
    })
  })

  describe('updateProjectProperties', () => {
    it("saves the properties to the project's item, and reads them back when asked", async () => {
      const { instance, updates } = service()
      expect(await instance.updateProjectProperties({ GtProjectGoals: 'Ny bane' })).toBeNull()
      const data = await instance.updateProjectProperties({ GtProjectGoals: 'Ny bane' }, true)
      expect(updates).toEqual([
        { list: LIST_ID, id: 1, properties: { GtProjectGoals: 'Ny bane' } },
        { list: LIST_ID, id: 1, properties: { GtProjectGoals: 'Ny bane' } }
      ])
      expect(data.fieldValues.get('Title', { format: 'text' })).toBe('Frisbeegolfbane')
    })

    it('says so when the project has no item of its own to save to', async () => {
      const { instance } = service({ hasItem: false }, hub())
      await expect(instance.updateProjectProperties({ GtProjectGoals: 'Ny bane' })).rejects.toThrow(
        format(strings.ProjectPropertiesNotFoundErrorText, 'Prosjektegenskaper')
      )
    })
  })

  describe('getChecklistData', () => {
    const item = (ID: number, Title: string, GtChecklistStatus: string, TermGuid?: string) => ({
      ID,
      Title,
      GtComment: '',
      GtChecklistStatus,
      GtProjectPhase: TermGuid ? { TermGuid } : null
    })

    it("counts each phase's checklist by status, leaving out the items without a phase", async () => {
      const { instance } = service({
        checklist: [
          item(1, 'Mål er definert', 'Gjennomført', 'term-3'),
          item(2, 'Risiko er vurdert', 'Åpen', 'term-3'),
          item(3, 'Sluttrapport er skrevet', 'Åpen', 'term-4'),
          item(4, 'Uten fase', 'Åpen'),
          item(5, 'Gevinster er målt', 'Åpen', 'term-3')
        ]
      })
      const data = await instance.getChecklistData('Fasesjekkliste')
      expect(Object.keys(data)).toEqual(['term-3', 'term-4'])
      expect(data['term-3'].stats).toEqual({ Gjennomført: 1, Åpen: 2 })
      expect(data['term-3'].items.map(({ title }) => title)).toEqual([
        'Mål er definert',
        'Risiko er vurdert',
        'Gevinster er målt'
      ])
      expect(data['term-4'].stats).toEqual({ Åpen: 1 })
    })

    it('has no checklist when the list cannot be read', async () => {
      const { instance } = service({ checklist: new Error('404 Not Found') })
      expect(await instance.getChecklistData('Fasesjekkliste')).toEqual({})
    })
  })

  it("reads the site's welcome page, or takes the project's home page when it cannot", async () => {
    const { instance } = service({ welcomePage: 'SitePages/Gjennomforing.aspx' })
    expect(await instance.getWelcomePage()).toBe('SitePages/Gjennomforing.aspx')
    const { instance: denied } = service({ welcomePage: new Error('403 Forbidden') })
    expect(await denied.getWelcomePage()).toBe('SitePages/ProjectHome.aspx')
  })
})
