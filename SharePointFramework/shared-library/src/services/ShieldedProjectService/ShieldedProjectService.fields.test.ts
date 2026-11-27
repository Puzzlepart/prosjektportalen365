// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. `sp` is the project site as the service meets it when it gives
// a list its fields: the site's columns, the list's fields and what the list's copy of the
// content type links, with what each link says of its field. A JSOM call is queued and takes
// effect when the query runs, as in a browser. `did` is what the service made, and what it warned
// of.
const sp = {
  siteColumns: new Set<string>(),
  listFields: new Set<string>(),
  links: new Set<string>(),
  /** What a link says of its field; a link not named here neither hides nor requires it. */
  linkSettings: {} as Record<string, { hidden: boolean; required: boolean }>,
  /**
   * Whether SharePoint links a field it adds to the list to the content type by itself: it does
   * for the list's default content type, which the bound one is in a new list.
   */
  linksByItself: true,
  /** The fields SharePoint links along with a field: a taxonomy field's hidden companions. */
  linkedAlong: {} as Record<string, string[]>,
  refusedSiteColumns: new Set<string>(),
  /** Site columns the list will not take. */
  refusedByList: new Set<string>(),
  refusedLinks: new Set<string>(),
  /** Whether SharePoint refuses a change to what a link says of its field. */
  refusesLinkSettings: false,
  pending: [] as Array<() => void>
}
const did = {
  siteColumns: [] as string[],
  fromSiteColumn: [] as string[],
  onList: [] as string[],
  linked: [] as string[],
  linkSettings: [] as string[],
  queries: 0,
  hubListReads: 0,
  hubSiteColumnReads: 0,
  warnings: [] as string[]
}
const nameOf = (xml: string) => /\sName="([^"]+)"/.exec(xml)[1]
const link = (name: string) => {
  sp.links.add(name)
  for (const companion of sp.linkedAlong[name] ?? []) sp.links.add(companion)
}
const addToList = (name: string) => {
  sp.listFields.add(name)
  if (sp.linksByItself) link(name)
}
const settingsOf = (name: string) =>
  (sp.linkSettings[name] = sp.linkSettings[name] ?? { hidden: false, required: false })
const setLink = (name: string, setting: 'hidden' | 'required', value: boolean) =>
  sp.pending.push(() => {
    if (sp.refusesLinkSettings) throw new Error('Innstillingen kan ikke endres')
    settingsOf(name)[setting] = value
    did.linkSettings.push(`${name} ${setting}=${value}`)
  })
jest.mock('@pnp/logging', () => {
  // Every `@pnp/*` import is one stub: a proxy keeps its other values.
  const stub = jest.requireActual('@pnp/logging')
  const Logger = {
    write: (message: string, level = 1) => {
      if (level >= 2) did.warnings.push(message)
    },
    log: () => undefined
  }
  return new Proxy(stub, { get: (target, prop) => (prop === 'Logger' ? Logger : target[prop]) })
})
jest.mock('spfx-jsom', () => ({
  __esModule: true,
  default: () =>
    Promise.resolve({
      jsomContext: {
        clientContext: { load: () => undefined },
        web: {
          get_fields: () => ({ getByInternalNameOrTitle: (name: string) => ({ name }) }),
          get_lists: () => ({
            getByTitle: () => ({
              get_fields: () => ({
                getByInternalNameOrTitle: (name: string) => ({ name }),
                add: (field: { name: string }) => {
                  sp.pending.push(() => {
                    if (!sp.siteColumns.has(field.name) || sp.refusedByList.has(field.name)) {
                      throw new Error('Kolonnen kan ikke legges til')
                    }
                    addToList(field.name)
                    did.fromSiteColumn.push(field.name)
                  })
                  return field
                },
                addFieldAsXml: (xml: string) => {
                  sp.pending.push(() => {
                    addToList(nameOf(xml))
                    did.onList.push(nameOf(xml))
                  })
                  return { set_title: () => undefined, update: () => undefined }
                }
              }),
              get_contentTypes: () => ({
                getById: () => ({
                  update: () => undefined,
                  get_fieldLinks: () => ({
                    getEnumerator: () => {
                      const names = [...sp.links]
                      let index = -1
                      return {
                        moveNext: () => ++index < names.length,
                        get_current: () => {
                          const name = names[index]
                          return {
                            get_name: () => name,
                            get_hidden: () => settingsOf(name).hidden,
                            get_required: () => settingsOf(name).required,
                            set_hidden: (value: boolean) => setLink(name, 'hidden', value),
                            set_required: (value: boolean) => setLink(name, 'required', value)
                          }
                        }
                      }
                    },
                    add: (information: { field: { name: string } }) => {
                      sp.pending.push(() => {
                        const { name } = information.field
                        // SharePoint refuses a second link to a field with «Ukjent feil».
                        if (sp.refusedLinks.has(name) || sp.links.has(name)) {
                          throw new Error('Ukjent feil')
                        }
                        link(name)
                        did.linked.push(name)
                      })
                    }
                  })
                })
              })
            })
          })
        }
      }
    }),
  ExecuteJsomQuery: () => {
    did.queries++
    try {
      sp.pending.splice(0).forEach((action) => action())
      return Promise.resolve()
    } catch (error) {
      // A JSOM query rejects with the sender and the arguments, not with an error.
      return Promise.reject({ sender: {}, args: { get_message: () => (error as Error).message } })
    }
  }
}))
// What `sp.js` gives a page.
;(globalThis as any).SP = {
  AddFieldOptions: { addFieldInternalNameHint: 8 },
  FieldLinkCreationInformation: class {
    public field: unknown
    public set_field(field: unknown) {
      this.field = field
    }
  }
}

import { ShieldedProjectService } from './ShieldedProjectService'

const STATUS = '0x010022252E35737A413FB56A1BA53862F6D5'
const LIST_COPY = `${STATUS}00A1B2C3D4E5F60718293A4B5C6D7E8F90`
const LIST = 'Prosjektstatus'

/**
 * A field on the hub as a content type or a list has it, with what its schema says of where it
 * was read and, in `says`, what the content type says of it.
 */
const hubField = (InternalName: string, TypeAsString = 'Text', says = '') => ({
  InternalName,
  Title: `${InternalName} (tittel)`,
  TypeAsString,
  SchemaXml: `<Field Type="${TypeAsString}" Name="${InternalName}" StaticName="${InternalName}" DisplayName="${InternalName} (tittel)" ID="{fba7ced6-9970-4b14-ab9c-7c809310d86d}" SourceID="{c176320f-7d06-4df5-810f-b1a6288c6a73}" Version="3" WebId="hub" List="hublist" ColName="nvarchar12" RowOrdinal="0" Group="Kolonner for Prosjektportalen (Portefølje)" ${says}/>`
})

/** The hub's own site column of the name. */
const hubSiteColumn = (InternalName: string) => ({
  InternalName,
  SchemaXml: `<Field Type="Text" Name="${InternalName}" StaticName="${InternalName}" DisplayName="${InternalName} (tittel)" Description="Hubens områdekolonne" ID="{fba7ced6-9970-4b14-ab9c-7c809310d86d}" SourceID="{c176320f-7d06-4df5-810f-b1a6288c6a73}" Version="7" Group="Kolonner for Prosjektportalen (Portefølje)" />`
})

/**
 * The service between a hub and the project site in `sp`. The hub's content type has
 * `contentTypeFields`, and says of them what `hubLinks` does; the hub has the site columns of
 * `hubSiteColumns`, or they cannot be read (`null`); its list has the content types and fields of
 * `hubList`, or cannot be read. The project site has the content type, and its list a copy of it
 * already.
 */
function service({
  contentTypeFields = ['Title', 'GtStatusTime', 'GtSiteId'] as Array<
    string | ReturnType<typeof hubField>
  >,
  hubLinks = [] as { Name: string; Hidden?: boolean; Required?: boolean }[],
  hubSiteColumns = [] as ReturnType<typeof hubSiteColumn>[] | null,
  hubList = undefined as
    { contentTypes: Record<string, string[]>; fields: ReturnType<typeof hubField>[] } | undefined
} = {}) {
  const hubWeb = {
    contentTypes: {
      getById: () => ({
        select: () => ({
          expand: () => () =>
            Promise.resolve({
              Fields: contentTypeFields.map((field) =>
                typeof field === 'string' ? hubField(field) : field
              ),
              FieldLinks: hubLinks
            })
        })
      })
    },
    fields: {
      select: () => () => {
        did.hubSiteColumnReads++
        return hubSiteColumns
          ? Promise.resolve(hubSiteColumns)
          : Promise.reject(new Error('503 SERVICE UNAVAILABLE'))
      }
    },
    lists: {
      getByTitle: () => ({
        contentTypes: {
          select: () => ({
            expand: () => () => {
              did.hubListReads++
              return hubList
                ? Promise.resolve(
                    Object.entries(hubList.contentTypes).map(([StringId, names]) => ({
                      StringId,
                      FieldLinks: names.map((Name) => ({ Name }))
                    }))
                  )
                : Promise.reject(new Error('403 FORBIDDEN'))
            }
          })
        },
        fields: {
          filter: () => ({ select: () => () => Promise.resolve(hubList?.fields ?? []) })
        }
      })
    }
  }
  const names = (set: Set<string>) => [...set].map((InternalName) => ({ InternalName }))
  const list = {
    update: () => Promise.resolve(),
    contentTypes: { select: () => () => Promise.resolve([{ StringId: LIST_COPY }]) }
  }
  const projectWeb = {
    contentTypes: { select: () => () => Promise.resolve([{ StringId: STATUS }]) },
    fields: {
      select: () => () => Promise.resolve(names(sp.siteColumns)),
      createFieldAsXml: (xml: string) => {
        if (sp.refusedSiteColumns.has(nameOf(xml))) {
          return Promise.reject(new Error('Feltet kan ikke opprettes'))
        }
        sp.siteColumns.add(nameOf(xml))
        did.siteColumns.push(xml)
        return Promise.resolve({})
      }
    },
    lists: {
      ensure: () => Promise.resolve({ list, created: false }),
      getByTitle: () => ({ fields: { select: () => () => Promise.resolve(names(sp.listFields)) } })
    }
  }
  return new ShieldedProjectService(
    hubWeb as any,
    projectWeb as any,
    'https://contoso.sharepoint.com/sites/skjermet'
  )
}

const ensure = (shielded: ShieldedProjectService, includeHubListFields = false) =>
  shielded.ensureList({
    listName: LIST,
    template: 100,
    contentTypeId: STATUS,
    includeHubListFields
  })

beforeEach(() => {
  // A new list: its own title field, and a site with one of the hub's columns already.
  sp.siteColumns = new Set(['Title', 'GtStatusTime'])
  sp.listFields = new Set(['Title'])
  sp.links = new Set(['Title'])
  sp.linkSettings = {}
  sp.linksByItself = true
  sp.linkedAlong = {}
  sp.refusedSiteColumns = new Set()
  sp.refusedByList = new Set()
  sp.refusedLinks = new Set()
  sp.refusesLinkSettings = false
  sp.pending = []
  did.siteColumns = []
  did.fromSiteColumn = []
  did.onList = []
  did.linked = []
  did.linkSettings = []
  did.queries = 0
  did.hubListReads = 0
  did.hubSiteColumnReads = 0
  did.warnings = []
})

describe("ShieldedProjectService: a list's fields", () => {
  it("adds every missing field from a site column, and makes the site columns the site lacks from the hub's schema, without what the schema says of the hub", async () => {
    const result = await ensure(service())
    expect(result.listContentTypeId).toBe(LIST_COPY)
    // Search gives the portfolio the values of a field added from a site column only.
    expect(did.fromSiteColumn).toEqual(['GtStatusTime', 'GtSiteId'])
    expect(did.onList).toEqual([])
    expect(did.siteColumns.map(nameOf)).toEqual(['GtSiteId'])
    const [schema] = did.siteColumns
    expect(schema).toContain('DisplayName="GtSiteId (tittel)"')
    expect(schema).toContain('ID="{fba7ced6-9970-4b14-ab9c-7c809310d86d}"')
    for (const attribute of ['SourceID', 'Version', 'WebId', 'List', 'ColName', 'RowOrdinal']) {
      expect(schema).not.toContain(`${attribute}=`)
    }
    expect(did.warnings).toEqual([])
  })

  it("makes a site column from the hub's own site column, not from what a content type says of the field: one that hides it would hide it in every list of the project site", async () => {
    // The hub's project content type hides the budget fields a status report fills in.
    const budget = hubField('GtBudgetTotal', 'Currency', 'Hidden="TRUE" ReadOnly="FALSE" ')
    await ensure(
      service({
        contentTypeFields: ['Title', budget],
        hubSiteColumns: [hubSiteColumn('GtBudgetTotal')]
      })
    )
    expect(did.fromSiteColumn).toEqual(['GtBudgetTotal'])
    const [schema] = did.siteColumns
    expect(schema).toContain('Description="Hubens områdekolonne"')
    expect(schema).not.toContain('Hidden=')
    for (const attribute of ['SourceID', 'Version']) {
      expect(schema).not.toContain(`${attribute}=`)
    }
    expect(did.warnings).toEqual([])
  })

  it("reads the hub's site columns once for all the site columns it makes, and not at all when the site has them", async () => {
    sp.siteColumns = new Set(['Title'])
    await ensure(service({ hubSiteColumns: [hubSiteColumn('GtStatusTime')] }))
    expect(did.siteColumns.map(nameOf)).toEqual(['GtStatusTime', 'GtSiteId'])
    expect(did.hubSiteColumnReads).toBe(1)

    did.hubSiteColumnReads = 0
    await ensure(service({ hubSiteColumns: [hubSiteColumn('GtStatusTime')] }))
    expect(did.hubSiteColumnReads).toBe(0)
  })

  it("makes the site column from the field as it was read when the hub's site columns cannot be read, and says so once", async () => {
    sp.siteColumns = new Set(['Title'])
    await ensure(service({ hubSiteColumns: null }))
    expect(did.fromSiteColumn).toEqual(['GtStatusTime', 'GtSiteId'])
    expect(did.siteColumns.map(nameOf)).toEqual(['GtStatusTime', 'GtSiteId'])
    expect(did.hubSiteColumnReads).toBe(1)
    expect(did.warnings).toHaveLength(1)
    expect(did.warnings[0]).toContain("the hub's site columns")
    expect(did.warnings[0]).toContain('503 SERVICE UNAVAILABLE')
  })

  it('leaves the linking to SharePoint where it links a new field to the content type by itself, and warns of nothing', async () => {
    await ensure(service())
    expect(did.linked).toEqual([])
    expect([...sp.links]).toEqual(['Title', 'GtStatusTime', 'GtSiteId'])
    expect(did.warnings).toEqual([])
  })

  it("links the fields itself in a list whose default content type is another's, as the properties list's is", async () => {
    // The properties list: its fields are there from the sync, linked to its first content type.
    sp.listFields = new Set(['Title', 'GtStatusTime', 'GtSiteId'])
    sp.linksByItself = false
    await ensure(service())
    expect(did.fromSiteColumn).toEqual([])
    expect(did.linked).toEqual(['GtStatusTime', 'GtSiteId'])
    expect(did.warnings).toEqual([])
  })

  it("adds what the hub list has given its copy of the content type, and nothing of the hub list's other content types", async () => {
    const hubList = {
      contentTypes: {
        [`${STATUS}00B1B2C3D4E5F60718293A4B5C6D7E8F91`]: [
          'Title',
          'GtStatusTime',
          'GtAiStatus',
          'GtReportLookup'
        ],
        [`${STATUS}BA00C1B2C3D4E5F60718293A4B5C6D7E8F92`]: ['Title', 'GtBAProjectSHA']
      },
      fields: [
        hubField('GtStatusTime', 'Choice'),
        hubField('GtAiStatus', 'Choice'),
        hubField('GtBAProjectSHA', 'Choice'),
        hubField('GtReportLookup', 'Lookup')
      ]
    }
    await ensure(service({ hubList }), true)
    // PP-assistenten's column comes along; another template's and a lookup in a hub list do not.
    expect(did.fromSiteColumn).toEqual(['GtStatusTime', 'GtSiteId', 'GtAiStatus'])
    expect(did.siteColumns.map(nameOf)).toEqual(['GtSiteId', 'GtAiStatus'])
    expect([...sp.links]).toEqual(['Title', 'GtStatusTime', 'GtSiteId', 'GtAiStatus'])
    expect(did.warnings).toEqual([])
  })

  it('does not read the hub list for a list that is to have the content type alone', async () => {
    await ensure(service({ hubList: { contentTypes: {}, fields: [] } }))
    expect(did.hubListReads).toBe(0)
  })

  it("goes on with the content type's own fields when the hub list cannot be read, and says so", async () => {
    await ensure(service(), true)
    expect(did.fromSiteColumn).toEqual(['GtStatusTime', 'GtSiteId'])
    expect(did.warnings).toHaveLength(1)
    expect(did.warnings[0]).toContain(`[${LIST}]`)
    expect(did.warnings[0]).toContain('403 FORBIDDEN')
  })

  it('makes a column on the list when the site column cannot be made, and says what that costs', async () => {
    sp.refusedSiteColumns = new Set(['GtSiteId'])
    await ensure(service())
    expect(did.fromSiteColumn).toEqual(['GtStatusTime'])
    expect(did.onList).toEqual(['GtSiteId'])
    expect(did.warnings).toHaveLength(1)
    expect(did.warnings[0]).toContain('[GtSiteId]')
    expect(did.warnings[0]).toContain('search does not give the portfolio')
    expect(did.warnings[0]).toContain('Feltet kan ikke opprettes')
  })

  it('makes a column on the list too when the list will not take the site column, rather than leave the field out', async () => {
    sp.refusedByList = new Set(['GtStatusTime'])
    await ensure(service())
    expect(did.fromSiteColumn).toEqual(['GtSiteId'])
    expect(did.onList).toEqual(['GtStatusTime'])
    expect([...sp.listFields]).toEqual(['Title', 'GtStatusTime', 'GtSiteId'])
    expect(did.warnings).toHaveLength(1)
    expect(did.warnings[0]).toContain('[GtStatusTime]')
    expect(did.warnings[0]).toContain('Kolonnen kan ikke legges til')
  })

  it("names a field it could not link, with SharePoint's own word for why, and links the others", async () => {
    sp.listFields = new Set(['Title', 'GtStatusTime', 'GtSiteId'])
    sp.linksByItself = false
    sp.refusedLinks = new Set(['GtStatusTime'])
    await ensure(service())
    expect(did.linked).toEqual(['GtSiteId'])
    expect(did.warnings).toHaveLength(1)
    expect(did.warnings[0]).toContain('[GtStatusTime]')
    expect(did.warnings[0]).toContain('Ukjent feil')
  })

  it('warns of nothing for a field SharePoint linked along with its taxonomy field, and then refused a second link', async () => {
    // The properties list: the phase, and the hidden note field that holds its value as text.
    const fields = ['Title', 'GtProjectPhase', 'j25543a5815d485da9a5e0773ad762e9', 'GtSiteId']
    sp.listFields = new Set(fields)
    sp.linksByItself = false
    sp.linkedAlong = { GtProjectPhase: ['j25543a5815d485da9a5e0773ad762e9'] }
    await ensure(service({ contentTypeFields: fields }))
    expect(did.linked).toEqual(['GtProjectPhase', 'GtSiteId'])
    expect([...sp.links].sort()).toEqual([...fields].sort())
    expect(did.warnings).toEqual([])
  })

  it('adds, links and warns of nothing when the setup runs again', async () => {
    sp.siteColumns = new Set(['Title', 'GtStatusTime', 'GtSiteId'])
    sp.listFields = new Set(['Title', 'GtStatusTime', 'GtSiteId'])
    sp.links = new Set(['Title', 'GtStatusTime', 'GtSiteId'])
    await ensure(service())
    expect(did.siteColumns).toEqual([])
    expect(did.fromSiteColumn).toEqual([])
    expect(did.onList).toEqual([])
    expect(did.linked).toEqual([])
    expect(did.warnings).toEqual([])
  })

  it('tells of each field as it adds it', async () => {
    const progress: string[] = []
    await service().ensureList({
      listName: LIST,
      template: 100,
      contentTypeId: STATUS,
      progressFunc: (field) => progress.push(field)
    })
    expect(progress).toEqual(['GtStatusTime (tittel)', 'GtSiteId (tittel)'])
  })
})

describe("ShieldedProjectService: what the list's content type says of its fields", () => {
  /** The hub's status report content type: the title hidden, the status required. */
  const hubLinks = [
    { Name: 'Title', Hidden: true, Required: false },
    { Name: 'GtStatusTime', Hidden: false, Required: true },
    { Name: 'GtSiteId', Hidden: false, Required: false }
  ]

  it("gives the list's copy what the hub's content type says of each field, in one query: the panel a report is edited in reads the copy", async () => {
    // SharePoint's own links: the list's title is required, and no status is.
    sp.linkSettings = { Title: { hidden: false, required: true } }
    await ensure(service({ hubLinks }))
    expect(sp.linkSettings).toEqual({
      Title: { hidden: true, required: false },
      GtStatusTime: { hidden: false, required: true },
      GtSiteId: { hidden: false, required: false }
    })
    expect(did.linkSettings).toEqual([
      'Title hidden=true',
      'Title required=false',
      'GtStatusTime hidden=false',
      'GtStatusTime required=true'
    ])
    expect(did.warnings).toEqual([])

    // The fields are there now: the links are read once and changed in one query more.
    sp.linkSettings = { Title: { hidden: false, required: true } }
    did.queries = 0
    await ensure(service({ hubLinks }))
    expect(did.queries).toBe(2)
  })

  it('changes no link that says the same already, and asks SharePoint nothing more than what the links are', async () => {
    sp.siteColumns = new Set(['Title', 'GtStatusTime', 'GtSiteId'])
    sp.listFields = new Set(['Title', 'GtStatusTime', 'GtSiteId'])
    sp.links = new Set(['Title', 'GtStatusTime', 'GtSiteId'])
    sp.linkSettings = {
      Title: { hidden: true, required: false },
      GtStatusTime: { hidden: false, required: true }
    }
    await ensure(service({ hubLinks }))
    expect(did.linkSettings).toEqual([])
    expect(did.queries).toBe(1)
  })

  it("leaves alone a link the hub's content type has none for, such as a column the hub list has given its copy", async () => {
    sp.listFields = new Set(['Title', 'GtStatusTime', 'GtSiteId', 'GtAiStatus'])
    sp.links = new Set(['Title', 'GtStatusTime', 'GtSiteId', 'GtAiStatus'])
    sp.linkSettings = {
      Title: { hidden: true, required: false },
      GtStatusTime: { hidden: false, required: true },
      GtAiStatus: { hidden: true, required: false }
    }
    await ensure(service({ hubLinks }))
    expect(did.linkSettings).toEqual([])
  })

  it('says which fields it is about when SharePoint refuses the change, and the setup goes on', async () => {
    sp.linkSettings = { Title: { hidden: false, required: true } }
    sp.refusesLinkSettings = true
    const result = await ensure(service({ hubLinks }))
    expect(result.listContentTypeId).toBe(LIST_COPY)
    expect(did.linkSettings).toEqual([])
    expect(did.warnings).toHaveLength(1)
    expect(did.warnings[0]).toContain(`[${LIST}]`)
    expect(did.warnings[0]).toContain('[Title, GtStatusTime]')
    expect(did.warnings[0]).toContain('Innstillingen kan ikke endres')
  })
})
