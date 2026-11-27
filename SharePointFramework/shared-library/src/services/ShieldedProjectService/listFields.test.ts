import {
  getFieldLinkChanges,
  getListContentTypeFieldNames,
  getListOwnFields,
  getSiteColumnSchema,
  isHiddenByContentType,
  isHiddenInSchema
} from './listFields'

const STATUS = '0x010022252E35737A413FB56A1BA53862F6D5'
const GUID = 'A1B2C3D4E5F60718293A4B5C6D7E8F90'
const OTHER_GUID = 'B1B2C3D4E5F60718293A4B5C6D7E8F91'

const field = (InternalName: string, TypeAsString = 'Text') => ({ InternalName, TypeAsString })
const contentType = (StringId: string, ...names: string[]) => ({
  StringId,
  FieldLinks: names.map((Name) => ({ Name }))
})

/** The hub's list for status reports: a copy of the status content type and of one built on it. */
const HUB_LIST = [
  contentType(`${STATUS}00${GUID}`, 'Title', 'GtStatusTime', 'GtAiStatus'),
  contentType(`${STATUS}BA00${OTHER_GUID}`, 'Title', 'GtStatusTime', 'GtBAProjectSHA'),
  contentType(`0x012000${GUID}`, 'Title')
]

describe('getListContentTypeFieldNames', () => {
  it("names the fields the list's own copy of the content type links, the list's additions among them", () => {
    expect(getListContentTypeFieldNames(HUB_LIST, STATUS)).toEqual([
      'Title',
      'GtStatusTime',
      'GtAiStatus'
    ])
    expect(getListContentTypeFieldNames(HUB_LIST, `${STATUS}BA`.toLowerCase())).toEqual([
      'Title',
      'GtStatusTime',
      'GtBAProjectSHA'
    ])
  })

  it("asks the copy of the closest content type it is built on when the list has none of the template's own, never another template's", () => {
    // A template's own status content type that the hub's list has no copy of.
    expect(getListContentTypeFieldNames(HUB_LIST, `${STATUS}DE`)).toEqual([
      'Title',
      'GtStatusTime',
      'GtAiStatus'
    ])
    expect(getListContentTypeFieldNames(HUB_LIST, `${STATUS}00${OTHER_GUID}`)).toEqual([
      'Title',
      'GtStatusTime',
      'GtAiStatus'
    ])
  })

  it('names nothing for a list without a copy of the content type or of one it is built on', () => {
    expect(
      getListContentTypeFieldNames(HUB_LIST, '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C')
    ).toEqual([])
    expect(getListContentTypeFieldNames([], STATUS)).toEqual([])
    expect(getListContentTypeFieldNames(undefined, STATUS)).toEqual([])
    expect(getListContentTypeFieldNames(HUB_LIST, undefined)).toEqual([])
    // A copy without field links links nothing.
    expect(getListContentTypeFieldNames([{ StringId: `${STATUS}00${GUID}` }], STATUS)).toEqual([])
  })
})

describe('getListOwnFields', () => {
  const hubFields = [
    field('GtStatusTime', 'Choice'),
    field('GtAiStatus', 'Choice'),
    field('GtAiStatusScoreNumber', 'Number'),
    field('GtBAProjectSHA', 'Choice')
  ]

  it("gives the fields the list's copy links beyond the content type's own, in the list's order", () => {
    expect(
      getListOwnFields(
        hubFields,
        ['Title', 'GtStatusTime', 'GtAiStatusScoreNumber', 'GtAiStatus'],
        ['Title', 'GtStatusTime']
      )
    ).toEqual([hubFields[1], hubFields[2]])
  })

  it('leaves out a lookup, which looks up in a list on the hub', () => {
    const lookups = [field('GtSiteIdLookup', 'Lookup'), field('GtTags', 'LookupMulti')]
    expect(getListOwnFields(lookups, ['GtSiteIdLookup', 'GtTags'], [])).toEqual([])
  })

  it('gives nothing when the copy links only the content type itself, and for a list without fields', () => {
    expect(getListOwnFields(hubFields, ['GtStatusTime'], ['GtStatusTime'])).toEqual([])
    expect(getListOwnFields(hubFields, [], [])).toEqual([])
    expect(getListOwnFields([], ['GtAiStatus'], [])).toEqual([])
    expect(getListOwnFields(undefined, undefined, undefined)).toEqual([])
    // A field without an internal name cannot be told from any other.
    expect(getListOwnFields([field('')], [''], [])).toEqual([])
  })
})

/** The budget field a status report fills in, as the hub has it and as its project content type does. */
const BUDGET = '<Field Type="Currency" Name="GtBudgetTotal" DisplayName="Budsjett totalt" />'
const BUDGET_IN_PROJECT =
  '<Field Type="Currency" Name="GtBudgetTotal" DisplayName="Budsjett totalt" Hidden="TRUE" Required="FALSE" ReadOnly="FALSE" />'
/** A taxonomy field's note field, hidden as a site column. */
const NOTE =
  '<Field Type="Note" Name="j25543a5815d485da9a5e0773ad762e9" Hidden="TRUE" CanToggleHidden="TRUE" />'
const HUB_SITE_COLUMNS = [
  { InternalName: 'GtBudgetTotal', SchemaXml: BUDGET },
  { InternalName: 'j25543a5815d485da9a5e0773ad762e9', SchemaXml: NOTE }
]

describe('getSiteColumnSchema', () => {
  it("takes the hub's own site column, not what a content type or a list says of the field", () => {
    expect(
      getSiteColumnSchema(
        { InternalName: 'GtBudgetTotal', SchemaXml: BUDGET_IN_PROJECT },
        HUB_SITE_COLUMNS
      )
    ).toBe(BUDGET)
  })

  it("takes the field's own schema where the hub has no site column of the name, or none could be read", () => {
    const field = { InternalName: 'GtAiStatus', SchemaXml: '<Field Name="GtAiStatus" />' }
    expect(getSiteColumnSchema(field, HUB_SITE_COLUMNS)).toBe(field.SchemaXml)
    expect(getSiteColumnSchema(field, [])).toBe(field.SchemaXml)
    expect(getSiteColumnSchema(field, undefined)).toBe(field.SchemaXml)
    // A site column read without its schema gives nothing to make one from.
    expect(getSiteColumnSchema(field, [{ InternalName: 'GtAiStatus', SchemaXml: undefined }])).toBe(
      field.SchemaXml
    )
  })
})

describe('isHiddenInSchema', () => {
  it('reads whether the field is hidden from the field element itself', () => {
    expect(isHiddenInSchema({ SchemaXml: BUDGET_IN_PROJECT })).toBe(true)
    expect(isHiddenInSchema({ SchemaXml: NOTE })).toBe(true)
    expect(isHiddenInSchema({ SchemaXml: BUDGET })).toBe(false)
    expect(isHiddenInSchema({ SchemaXml: '<Field Name="GtSiteId" Hidden="FALSE" />' })).toBe(false)
    // What an element inside the field says is not about the field.
    expect(
      isHiddenInSchema({ SchemaXml: '<Field Name="GtTags"><Property Hidden="TRUE" /></Field>' })
    ).toBe(false)
  })

  it('takes a field without a schema as not hidden', () => {
    expect(isHiddenInSchema({})).toBe(false)
    expect(isHiddenInSchema(undefined)).toBe(false)
  })
})

describe('isHiddenByContentType', () => {
  it("tells a field the content type hides in its forms from one that is hidden itself, by the hub's site column", () => {
    expect(
      isHiddenByContentType(
        { InternalName: 'GtBudgetTotal', SchemaXml: BUDGET_IN_PROJECT },
        HUB_SITE_COLUMNS
      )
    ).toBe(true)
    expect(
      isHiddenByContentType(
        { InternalName: 'j25543a5815d485da9a5e0773ad762e9', SchemaXml: NOTE },
        HUB_SITE_COLUMNS
      )
    ).toBe(false)
  })

  it('is not so for a field the content type shows, or without the hub site column to tell by', () => {
    expect(
      isHiddenByContentType({ InternalName: 'GtBudgetTotal', SchemaXml: BUDGET }, HUB_SITE_COLUMNS)
    ).toBe(false)
    const hidden = { InternalName: 'GtBudgetTotal', SchemaXml: BUDGET_IN_PROJECT }
    expect(isHiddenByContentType(hidden, [])).toBe(false)
    expect(isHiddenByContentType(hidden, undefined)).toBe(false)
  })
})

describe('getFieldLinkChanges', () => {
  /** The hub's status report content type: the title hidden, the status required. */
  const hubLinks = [
    { Name: 'Title', Hidden: true, Required: false },
    { Name: 'GtStatusTime', Hidden: false, Required: true },
    { Name: 'GtBudgetTotal', Hidden: false, Required: false },
    { Name: 'GtSiteId' }
  ]

  it("gives the links that say something else than the hub's content type, with what they are to say", () => {
    expect(
      getFieldLinkChanges(hubLinks, [
        { Name: 'Title', Hidden: false, Required: true },
        { Name: 'GtStatusTime', Hidden: false, Required: false },
        { Name: 'GtBudgetTotal', Hidden: false, Required: false },
        { Name: 'GtSiteId', Hidden: false, Required: false }
      ])
    ).toEqual([
      { Name: 'Title', Hidden: true, Required: false },
      { Name: 'GtStatusTime', Hidden: false, Required: true }
    ])
  })

  it("leaves alone a link the hub's content type has none for, such as a column the list has given its copy", () => {
    expect(getFieldLinkChanges(hubLinks, [{ Name: 'GtAiStatus', Hidden: true }])).toEqual([])
  })

  it('gives nothing when every link says the same already, and without links', () => {
    expect(
      getFieldLinkChanges(hubLinks, [
        { Name: 'Title', Hidden: true, Required: false },
        { Name: 'GtStatusTime', Required: true },
        { Name: 'GtSiteId' }
      ])
    ).toEqual([])
    expect(getFieldLinkChanges(hubLinks, [])).toEqual([])
    expect(getFieldLinkChanges(undefined, [{ Name: 'Title', Required: true }])).toEqual([])
    expect(getFieldLinkChanges(hubLinks, undefined)).toEqual([])
  })
})
