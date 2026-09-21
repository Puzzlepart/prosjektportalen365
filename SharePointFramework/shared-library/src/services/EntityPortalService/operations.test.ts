import {
  ENTITY_FIELD_SELECTS,
  addEntityItem,
  createEntityUrls,
  createNewEntityProperties,
  escapeODataStringLiteral,
  fetchEntity,
  getEntityFields,
  getEntityItem,
  getEntityItemFieldValues,
  getEntityUrls,
  normalizeEntityIdentity,
  updateEntityItem
} from './operations'
import { ISpFieldsShape, ISpItemShape, ISpItemsShape, ISpListShape } from './pnpShapes'

/**
 * Hand rolled fakes for the PnPjs surface used by `operations.ts`.
 *
 * PnPjs 4 is ESM only, so importing it into the CommonJS Jest environment is avoided
 * entirely. A PnPjs queryable is an invokable function object with chainable methods, and
 * these fakes reproduce exactly that, while recording the calls so tests can assert on the
 * query that would have been sent.
 */

/**
 * Records every chained query call made against a fake queryable.
 */
interface IRecordedQuery {
  select: string[][]
  filter: string[]
  top: number[]
  expand: string[][]
  invocations: number
}

/**
 * A fake queryable: callable to execute, chainable for query options.
 */
type FakeQueryable<T> = {
  <TResult = T>(): Promise<TResult>
  recorded: IRecordedQuery
} & Record<string, any>

/**
 * Create a fake PnPjs queryable resolving to `result`.
 *
 * @param result Value the queryable resolves to, or a function throwing to simulate a failure
 */
function createFakeQueryable<T>(result: T | (() => T)): FakeQueryable<T> {
  const recorded: IRecordedQuery = {
    select: [],
    filter: [],
    top: [],
    expand: [],
    invocations: 0
  }
  const queryable: any = () => {
    recorded.invocations++
    try {
      return Promise.resolve(typeof result === 'function' ? (result as () => T)() : result)
    } catch (error) {
      return Promise.reject(error)
    }
  }
  queryable.recorded = recorded
  queryable.select = (...selects: string[]) => {
    recorded.select.push(selects)
    return queryable
  }
  queryable.expand = (...expands: string[]) => {
    recorded.expand.push(expands)
    return queryable
  }
  queryable.filter = (filter: string) => {
    recorded.filter.push(filter)
    return queryable
  }
  queryable.top = (top: number) => {
    recorded.top.push(top)
    return queryable
  }
  return queryable as FakeQueryable<T>
}

/**
 * Everything a test needs to set up and inspect a fake entity list.
 */
interface IFakeList {
  list: ISpListShape
  fields: ISpFieldsShape

  /**
   * One recorded query per `list.items` property access, in access order.
   *
   * Real PnPjs returns a fresh queryable from `list.items` while `select`/`filter`/`top` mutate
   * and return that same instance. Recording per access is what makes query options leaking
   * from one call into the next visible: a leak shows up as options on the wrong entry, and a
   * skipped or extra access shows up in the length.
   */
  itemsQueries: IRecordedQuery[]

  /**
   * Query recorded against the list itself (used for the URL metadata query).
   */
  listQuery: IRecordedQuery

  /**
   * Query recorded against the content type field collection.
   */
  fieldsQuery: IRecordedQuery

  /**
   * Arguments the code passed to `items.add`.
   */
  addCalls: Record<string, any>[]

  /**
   * Item IDs passed to `items.getById`.
   */
  getByIdCalls: number[]

  /**
   * Arguments the code passed to `items.getById(id).update`.
   */
  updateCalls: { properties: Record<string, any>; eTag: string }[]
}

/**
 * Options for `createFakeList`.
 */
interface ICreateFakeListOptions {
  /**
   * Items the filtered items query resolves to.
   */
  items?: any[]

  /**
   * Fields the content type field query resolves to.
   */
  fields?: any[]

  /**
   * List metadata the URL query resolves to.
   */
  listMetadata?: { Id: string; DefaultEditFormUrl: string }

  /**
   * Field values `fieldValuesAsText` resolves to.
   */
  fieldValues?: Record<string, string>

  /**
   * Value `items.add` resolves to. PnPjs 4 returns the created item directly.
   */
  addResult?: any

  /**
   * Value `items.getById(id).update` resolves to. PnPjs 4 returns the endpoint response
   * directly.
   */
  updateResult?: any

  /**
   * Error thrown by the content type field query.
   */
  fieldsError?: Error
}

/**
 * Create a fake entity list plus the recorders needed to assert on it.
 */
function createFakeList(options: ICreateFakeListOptions = {}): IFakeList {
  const {
    items = [],
    fields = [],
    listMetadata = {
      Id: 'list-id',
      DefaultEditFormUrl: '/sites/portal/Lists/Projects/EditForm.aspx'
    },
    fieldValues = {},
    addResult = { Id: 1 },
    updateResult = { 'odata.etag': '"2"' },
    fieldsError
  } = options

  const addCalls: Record<string, any>[] = []
  const getByIdCalls: number[] = []
  const updateCalls: { properties: Record<string, any>; eTag: string }[] = []

  const itemsQueries: IRecordedQuery[] = []
  const listQueryable = createFakeQueryable(listMetadata)
  const fieldsQueryable = createFakeQueryable<any[]>(
    fieldsError
      ? () => {
          throw fieldsError
        }
      : fields
  )

  const item: ISpItemShape = {
    fieldValuesAsText: createFakeQueryable(fieldValues),
    update: (properties: Record<string, any>, eTag?: string) => {
      updateCalls.push({ properties, eTag })
      return Promise.resolve(updateResult)
    }
  }

  const createItemsCollection = (): ISpItemsShape => {
    const itemsQueryable = createFakeQueryable<any[]>(items)
    itemsQueries.push(itemsQueryable.recorded)
    const itemsCollection: any = itemsQueryable
    itemsCollection.getById = (id: number) => {
      getByIdCalls.push(id)
      return item
    }
    itemsCollection.add = (properties: Record<string, any>) => {
      addCalls.push(properties)
      return Promise.resolve(addResult)
    }
    return itemsCollection as ISpItemsShape
  }

  const list: any = listQueryable
  // A getter, not a property: PnPjs builds a new items queryable on every access, and reusing
  // one here would hide query options leaking between calls.
  Object.defineProperty(list, 'items', { get: createItemsCollection })

  return {
    list: list as ISpListShape,
    fields: fieldsQueryable as unknown as ISpFieldsShape,
    itemsQueries,
    listQuery: listQueryable.recorded,
    fieldsQuery: fieldsQueryable.recorded,
    addCalls,
    getByIdCalls,
    updateCalls
  }
}

const SITE_ID = '00000000-1111-2222-3333-444444444444'
const PORTAL_URL = 'https://contoso.sharepoint.com/sites/portal'

describe('normalizeEntityIdentity', () => {
  it('strips the curly braces from a 38 character GUID', () => {
    expect(normalizeEntityIdentity(`{${SITE_ID}}`)).toBe(SITE_ID)
  })

  it('leaves a bare 36 character GUID untouched', () => {
    expect(normalizeEntityIdentity(SITE_ID)).toBe(SITE_ID)
  })
})

describe('escapeODataStringLiteral', () => {
  it('doubles single quotes so the filter cannot be broken out of', () => {
    expect(escapeODataStringLiteral("o'brien")).toBe("o''brien")
  })
})

describe('getEntityItem', () => {
  it('requests a single item - PnPjs 4 sends no default $top', async () => {
    const fake = createFakeList({ items: [{ Id: 42 }] })
    const item = await getEntityItem(fake.list, 'GtSiteId', SITE_ID)
    expect(item).toEqual({ Id: 42 })
    expect(fake.itemsQueries).toHaveLength(1)
    expect(fake.itemsQueries[0].top).toEqual([1])
    expect(fake.itemsQueries[0].select).toEqual([])
  })

  it('filters on the identity field using the normalized identity', async () => {
    const fake = createFakeList({ items: [{ Id: 42 }] })
    await getEntityItem(fake.list, 'GtSiteId', `{${SITE_ID}}`)
    expect(fake.itemsQueries).toHaveLength(1)
    expect(fake.itemsQueries[0].filter).toEqual([`GtSiteId eq '${SITE_ID}'`])
  })

  it('escapes single quotes in the identity', async () => {
    const fake = createFakeList({ items: [] })
    await getEntityItem(fake.list, 'GtSiteId', "a'b")
    expect(fake.itemsQueries[0].filter).toEqual(["GtSiteId eq 'a''b'"])
  })

  it('resolves to undefined when nothing matches', async () => {
    const fake = createFakeList({ items: [] })
    await expect(getEntityItem(fake.list, 'GtSiteId', SITE_ID)).resolves.toBeUndefined()
  })

  it('refuses a null or empty identity instead of querying the portal', async () => {
    const fake = createFakeList({ items: [{ Id: 42 }] })
    await expect(getEntityItem(fake.list, 'GtSiteId', null)).rejects.toThrow(
      '(EntityPortalService) (getEntityItem) No identity given for GtSiteId.'
    )
    await expect(getEntityItem(fake.list, 'GtSiteId', '')).rejects.toThrow(/No identity given/)
    // Unguarded, the template literal produced a live `$filter=GtSiteId eq 'null'` query.
    expect(fake.itemsQueries).toHaveLength(0)
  })
})

describe('getEntityFields', () => {
  it('returns an empty array when no content type is configured', async () => {
    await expect(getEntityFields(null)).resolves.toEqual([])
  })

  it('selects the fields the consumers read', async () => {
    const fake = createFakeList({ fields: [{ InternalName: 'GtProjectPhase' }] })
    const fields = await getEntityFields(fake.fields)
    expect(fields).toEqual([{ InternalName: 'GtProjectPhase' }])
    expect(fake.fieldsQuery.select).toEqual([ENTITY_FIELD_SELECTS])
    expect(fake.fieldsQuery.filter).toEqual([])
  })

  it('filters on the field prefix when one is configured', async () => {
    const fake = createFakeList({ fields: [] })
    await getEntityFields(fake.fields, 'Gt')
    expect(fake.fieldsQuery.filter).toEqual([`substringof('Gt', InternalName)`])
  })

  it('degrades to an empty array when the portal query fails', async () => {
    const fake = createFakeList({ fieldsError: new Error('403') })
    await expect(getEntityFields(fake.fields)).resolves.toEqual([])
  })

  it('hands the swallowed error to onError before degrading', async () => {
    const fieldsError = new Error('403')
    const fake = createFakeList({ fieldsError })
    const onError = jest.fn()
    await expect(getEntityFields(fake.fields, 'Gt', onError)).resolves.toEqual([])
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(fieldsError)
  })
})

describe('getEntityItemFieldValues', () => {
  it('reads the text representation of the field values', async () => {
    const fake = createFakeList({ fieldValues: { Title: 'Project A' } })
    await expect(getEntityItemFieldValues(fake.list, 7)).resolves.toEqual({ Title: 'Project A' })
    expect(fake.getByIdCalls).toEqual([7])
    expect(fake.itemsQueries).toHaveLength(1)
    expect(fake.itemsQueries[0].filter).toEqual([])
  })
})

describe('createEntityUrls', () => {
  const options = {
    origin: 'https://contoso.sharepoint.com',
    portalUrl: PORTAL_URL,
    listId: 'list-id',
    defaultEditFormUrl: '/sites/portal/Lists/Projects/EditForm.aspx',
    itemId: 12
  }

  it('builds absolute edit form and version history URLs', () => {
    expect(createEntityUrls(options)).toEqual({
      editFormUrl: 'https://contoso.sharepoint.com/sites/portal/Lists/Projects/EditForm.aspx?ID=12',
      versionHistoryUrl: `${PORTAL_URL}/_layouts/15/versions.aspx?list=list-id&ID=12`
    })
  })

  it('appends the encoded source URL to both URLs', () => {
    const urls = createEntityUrls({ ...options, sourceUrl: 'https://contoso.sharepoint.com/a b' })
    const source = `&Source=${encodeURIComponent('https://contoso.sharepoint.com/a b')}`
    expect(urls.editFormUrl).toBe(
      `https://contoso.sharepoint.com/sites/portal/Lists/Projects/EditForm.aspx?ID=12${source}`
    )
    // The original package overwrote the version history URL with the bare source fragment.
    expect(urls.versionHistoryUrl).toBe(
      `${PORTAL_URL}/_layouts/15/versions.aspx?list=list-id&ID=12${source}`
    )
    expect(urls.versionHistoryUrl.startsWith(PORTAL_URL)).toBe(true)
  })
})

describe('getEntityUrls', () => {
  it('selects and expands DefaultEditFormUrl on the list', async () => {
    const fake = createFakeList({
      listMetadata: { Id: 'abc', DefaultEditFormUrl: '/sites/portal/Lists/Projects/EditForm.aspx' }
    })
    const urls = await getEntityUrls(fake.list, {
      origin: 'https://contoso.sharepoint.com',
      portalUrl: PORTAL_URL,
      itemId: 3
    })
    expect(fake.listQuery.select).toEqual([['DefaultEditFormUrl', 'Id']])
    expect(fake.listQuery.expand).toEqual([['DefaultEditFormUrl']])
    expect(urls.versionHistoryUrl).toBe(`${PORTAL_URL}/_layouts/15/versions.aspx?list=abc&ID=3`)
  })

  it('appends the source URL to both URLs built from the list metadata', async () => {
    const fake = createFakeList({
      listMetadata: { Id: 'abc', DefaultEditFormUrl: '/sites/portal/Lists/Projects/EditForm.aspx' }
    })
    const sourceUrl = 'https://contoso.sharepoint.com/sites/project/SitePages/Home.aspx?a=1 b'
    const urls = await getEntityUrls(fake.list, {
      origin: 'https://contoso.sharepoint.com',
      portalUrl: PORTAL_URL,
      itemId: 3,
      sourceUrl
    })
    const source = `&Source=${encodeURIComponent(sourceUrl)}`
    expect(urls.editFormUrl).toBe(
      `https://contoso.sharepoint.com/sites/portal/Lists/Projects/EditForm.aspx?ID=3${source}`
    )
    // The original package assigned here, leaving the bare `&Source=...` fragment behind.
    expect(urls.versionHistoryUrl).toBe(
      `${PORTAL_URL}/_layouts/15/versions.aspx?list=abc&ID=3${source}`
    )
    expect(urls.versionHistoryUrl.startsWith(PORTAL_URL)).toBe(true)
  })
})

describe('fetchEntity', () => {
  const options = {
    identity: SITE_ID,
    identityFieldName: 'GtSiteId',
    listName: 'Prosjekter',
    portalUrl: PORTAL_URL,
    origin: 'https://contoso.sharepoint.com'
  }

  it('returns item, fields, urls and field values', async () => {
    const fake = createFakeList({
      items: [{ Id: 9, Title: 'Project A' }],
      fields: [{ InternalName: 'GtProjectPhase' }],
      fieldValues: { Title: 'Project A' }
    })
    const entity = await fetchEntity(fake.list, fake.fields, options)
    expect(entity.item).toEqual({ Id: 9, Title: 'Project A' })
    expect(entity.fields).toEqual([{ InternalName: 'GtProjectPhase' }])
    expect(entity.fieldValues).toEqual({ Title: 'Project A' })
    expect(entity.urls.editFormUrl).toContain('?ID=9')
    expect(fake.getByIdCalls).toEqual([9])
    // One access to look the item up, one to read its field values - and the lookup's `$filter`
    // must not have leaked onto the second.
    expect(fake.itemsQueries).toHaveLength(2)
    expect(fake.itemsQueries[1].filter).toEqual([])
    expect(fake.itemsQueries[1].top).toEqual([])
  })

  it('threads the source URL into both generated URLs', async () => {
    const fake = createFakeList({ items: [{ Id: 9 }] })
    const sourceUrl = 'https://contoso.sharepoint.com/sites/project/SitePages/Home.aspx?a=1 b'
    const entity = await fetchEntity(fake.list, fake.fields, { ...options, sourceUrl })
    const source = `&Source=${encodeURIComponent(sourceUrl)}`
    expect(entity.urls.editFormUrl).toContain(source)
    expect(entity.urls.versionHistoryUrl).toContain(source)
    // The version history URL is appended to, not replaced by, the source fragment.
    expect(entity.urls.versionHistoryUrl.startsWith(PORTAL_URL)).toBe(true)
    expect(entity.urls.versionHistoryUrl).toBe(
      `${PORTAL_URL}/_layouts/15/versions.aspx?list=list-id&ID=9${source}`
    )
  })

  it('reports a failing content type field query through onFieldsError', async () => {
    const fieldsError = new Error('403')
    const fake = createFakeList({ items: [{ Id: 9 }], fieldsError })
    const onFieldsError = jest.fn()
    const entity = await fetchEntity(fake.list, fake.fields, { ...options, onFieldsError })
    expect(entity.fields).toEqual([])
    expect(onFieldsError).toHaveBeenCalledWith(fieldsError)
  })

  it('throws a descriptive error when the entity does not exist', async () => {
    const fake = createFakeList({ items: [] })
    await expect(fetchEntity(fake.list, fake.fields, options)).rejects.toThrow(
      /No entity found in list 'Prosjekter' where GtSiteId equals/
    )
  })
})

describe('updateEntityItem', () => {
  it('resolves the item by identity and updates it by ID', async () => {
    const fake = createFakeList({ items: [{ Id: 55 }] })
    await updateEntityItem(fake.list, 'GtSiteId', SITE_ID, { Title: 'New' })
    expect(fake.getByIdCalls).toEqual([55])
    expect(fake.updateCalls).toEqual([{ properties: { Title: 'New' }, eTag: '*' }])
  })

  it('passes the supplied eTag through', async () => {
    const fake = createFakeList({ items: [{ Id: 55 }] })
    await updateEntityItem(fake.list, 'GtSiteId', SITE_ID, { Title: 'New' }, '"3"')
    expect(fake.updateCalls[0].eTag).toBe('"3"')
  })

  it('returns the raw endpoint response - PnPjs 4 has no { data } wrapper', async () => {
    const updateResult = { 'odata.etag': '"4"' }
    const fake = createFakeList({ items: [{ Id: 55 }], updateResult })
    await expect(updateEntityItem(fake.list, 'GtSiteId', SITE_ID, {})).resolves.toBe(updateResult)
  })

  it('throws a descriptive error when no entity matches the identity', async () => {
    const fake = createFakeList({ items: [] })
    // Unguarded this was a raw `TypeError: Cannot read properties of undefined (reading 'Id')`.
    await expect(
      updateEntityItem(fake.list, 'GtSiteId', SITE_ID, { Title: 'New' })
    ).rejects.toThrow(
      `(EntityPortalService) (updateEntityItem) No entity found where GtSiteId equals '${SITE_ID}'.`
    )
    expect(fake.getByIdCalls).toEqual([])
    expect(fake.updateCalls).toEqual([])
  })
})

describe('createNewEntityProperties', () => {
  it('sets the identity and URL fields alongside the additional properties', () => {
    const properties = createNewEntityProperties(
      { identityFieldName: 'GtGroupId', urlFieldName: 'GtSiteUrl' },
      SITE_ID,
      'https://contoso.sharepoint.com/sites/project',
      { Title: 'Project A' }
    )
    expect(properties).toEqual({
      GtGroupId: SITE_ID,
      GtSiteUrl: 'https://contoso.sharepoint.com/sites/project',
      Title: 'Project A'
    })
  })

  it('omits the URL field when no URL field name is configured', () => {
    const properties = createNewEntityProperties(
      { identityFieldName: 'GtGroupId', urlFieldName: undefined },
      SITE_ID,
      'https://contoso.sharepoint.com/sites/project'
    )
    expect(properties).toEqual({ GtGroupId: SITE_ID })
  })

  it('does not let additional properties overwrite the URL field', () => {
    const properties = createNewEntityProperties(
      { identityFieldName: 'GtGroupId', urlFieldName: 'GtSiteUrl' },
      SITE_ID,
      'https://contoso.sharepoint.com/sites/project',
      { GtSiteUrl: 'https://example.invalid' }
    )
    expect(properties.GtSiteUrl).toBe('https://contoso.sharepoint.com/sites/project')
  })
})

describe('addEntityItem', () => {
  it('returns the raw endpoint response - PnPjs 4 has no { data, item } wrapper', async () => {
    const addResult = { Id: 101, Title: 'Project A' }
    const fake = createFakeList({ addResult })
    const result = await addEntityItem(fake.list, { Title: 'Project A' })
    expect(result).toBe(addResult)
    expect(fake.addCalls).toEqual([{ Title: 'Project A' }])
  })
})
