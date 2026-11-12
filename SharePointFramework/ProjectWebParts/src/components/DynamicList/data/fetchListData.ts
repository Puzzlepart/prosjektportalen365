import { IDynamicListProps, IDynamicListData } from '../types'
import SPDataAdapter from '../../../data'
import {
  EditableSPField,
  IListColumn,
  ProjectContentColumn,
  getAllItems,
  getTermStore
} from 'pp365-shared-library'
import type { IWeb } from '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/fields'
import '@pnp/sp/items'
import '@pnp/sp/views'
import { TaxonomyTermModel } from '../models/TaxonomyTermModel'
import { isVisibleListField, normalizeViewFieldNames } from '../utils/fieldUtils'

/** Reads hub column configuration for all list types, falling back to no enrichment on failure. */
async function fetchProjectContentColumns(): Promise<ProjectContentColumn[]> {
  try {
    if (SPDataAdapter.portalDataService?.isConfigured) {
      return await SPDataAdapter.portalDataService.fetchProjectContentColumns(
        'PROJECT_CONTENT_COLUMNS'
      )
    }
    return []
  } catch (error) {
    console.warn('[fetchListData] Could not fetch ProjectContentColumns configuration:', error)
    return []
  }
}

/** Merges matching hub column names, widths and render settings into SharePoint field columns. */
function enrichColumnsWithConfiguration(
  spColumns: IListColumn[],
  projectContentColumns: ProjectContentColumn[],
  useProjectContentColumnNames: boolean = true
): IListColumn[] {
  return spColumns.map((spColumn) => {
    const configColumn = projectContentColumns.find(
      (c) => c.internalName === spColumn.fieldName || c.fieldName === spColumn.fieldName
    )

    if (configColumn) {
      return {
        ...spColumn,
        name: useProjectContentColumnNames ? configColumn.name || spColumn.name : spColumn.name,
        minWidth: configColumn.minWidth,
        maxWidth: configColumn.maxWidth,
        dataType: configColumn.dataType,
        data: {
          ...spColumn.data,
          ...configColumn.data,
          dataTypeProperties:
            configColumn.data?.dataTypeProperties || spColumn.data?.dataTypeProperties
        }
      }
    }

    return spColumn
  })
}

/** Maps a SharePoint field type to a column renderer, falling back to its numeric field kind. */
function mapSharePointTypeToDataType(typeAsString: string, fieldTypeKind: number): string {
  const typeMapping: Record<string, string> = {
    Boolean: 'boolean',
    DateTime: 'date',
    Number: 'number',
    Currency: 'number',
    Integer: 'number',
    Counter: 'number',
    User: 'user',
    UserMulti: 'user',
    Lookup: 'text',
    LookupMulti: 'text',
    Choice: 'choice',
    MultiChoice: 'choice',
    URL: 'url',
    Note: 'note',
    Text: 'text'
  }

  const mappedType = typeMapping[typeAsString]
  if (mappedType) return mappedType

  switch (fieldTypeKind) {
    case 2:
    case 9:
    case 10:
      return 'number'
    case 4:
      return 'date'
    case 8:
      return 'boolean'
    case 20:
      return 'user'
    case 7:
      return 'text'
    case 6:
    case 15:
      return 'choice'
    case 11:
      return 'url'
    case 3:
      return 'note'
    default:
      return 'text'
  }
}

/** Builds select and expand projections for person fields. */
function getUserFieldsForQuery(fields: any[]): { select: string[]; expand: string[] } {
  const userFields = fields.filter(
    (field) =>
      field.TypeAsString === 'User' ||
      field.TypeAsString === 'UserMulti' ||
      field.FieldTypeKind === 20
  )

  const select: string[] = []
  const expand: string[] = []

  userFields.forEach((field) => {
    const fieldName = field.InternalName
    select.push(`${fieldName}/Title`, `${fieldName}/EMail`, `${fieldName}/Id`)
    expand.push(fieldName)
  })

  return { select, expand }
}

/**
 * SharePoint's List View Lookup Threshold: the maximum number of lookup/person/
 * managed-metadata columns (joins) a single query may project. In SharePoint
 * Online this is fixed at 12 and cannot be raised. Each `$expand` of a person
 * field is one join, so lists with many person columns (e.g. Prosjekter) throw
 * `SPQueryThrottledException` if we expand them all at once.
 *
 * We keep a safety margin below 12 to leave room for managed-metadata/lookup
 * columns that `$select=*` projects in the base request.
 */
const MAX_USER_FIELD_EXPANDS_PER_QUERY = 8

/** Builds the `Title`/`EMail`/`Id` select projections for a set of user fields. */
function userFieldSelects(fieldNames: string[]): string[] {
  const selects: string[] = []
  fieldNames.forEach((name) => {
    selects.push(`${name}/Title`, `${name}/EMail`, `${name}/Id`)
  })
  return selects
}

/** Splits an array into chunks of at most `size` elements. */
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * Fetches all list items while staying under SharePoint's lookup threshold.
 *
 * The base request projects everything (`*`) plus Author/Editor (and File for
 * document libraries). Remaining person fields are fetched in additional
 * requests of at most {@link MAX_USER_FIELD_EXPANDS_PER_QUERY} expands each,
 * selecting only `Id` + that chunk's person fields. Results are merged back onto
 * the base items by `Id`.
 */
async function fetchAllItemsChunked(
  list: any,
  userFieldsQuery: { select: string[]; expand: string[] },
  isDocumentLibrary: boolean
): Promise<any[]> {
  // Author/Editor (and File) are always expanded explicitly below; drop them
  // from the auto-detected user fields so they aren't expanded twice.
  const reserved = new Set(['Author', 'Editor', 'File'])
  const userExpands = userFieldsQuery.expand.filter((name) => !reserved.has(name))

  const baseSelect = isDocumentLibrary
    ? [
        '*',
        'FileRef',
        'FileLeafRef',
        'FileDirRef',
        'File/Name',
        'File/ServerRelativeUrl',
        'File/Length',
        'FSObjType',
        'File_x0020_Type',
        'Author/Title',
        'Author/EMail',
        'Author/Id',
        'Editor/Title',
        'Editor/EMail',
        'Editor/Id'
      ]
    : [
        '*',
        'Author/Title',
        'Author/EMail',
        'Author/Id',
        'Editor/Title',
        'Editor/EMail',
        'Editor/Id'
      ]
  const baseExpand = isDocumentLibrary ? ['Author', 'Editor', 'File'] : ['Author', 'Editor']

  const baseItems = await getAllItems(list.items.select(...baseSelect).expand(...baseExpand))

  if (userExpands.length === 0) {
    return baseItems
  }

  const itemsById = new Map<number, any>(baseItems.map((item: any) => [item.Id, item]))

  const chunkResults = await Promise.all(
    chunk(userExpands, MAX_USER_FIELD_EXPANDS_PER_QUERY).map((fieldNames) =>
      getAllItems(
        list.items.select('Id', ...userFieldSelects(fieldNames)).expand(...fieldNames)
      ).then((rows: any[]) => ({ fieldNames, rows }))
    )
  )

  for (const { fieldNames, rows } of chunkResults) {
    for (const row of rows) {
      const baseItem = itemsById.get(row.Id)
      if (!baseItem) continue
      for (const name of fieldNames) {
        baseItem[name] = row[name]
      }
    }
  }

  return baseItems
}

/** Resolves taxonomy labels and formats field values for list display and delta updates. */
export function transformListItem(
  item: any,
  columns: IListColumn[],
  taxonomyTermsMap: Map<string, TaxonomyTermModel[]>
): Record<string, any> {
  const transformedItem: Record<string, any> = { ...item }

  Object.keys(item).forEach((key) => {
    const value = item[key]
    const column = columns.find((col) => col.fieldName === key)

    if (column?.data?.termSetId && taxonomyTermsMap.has(column.data.termSetId)) {
      const terms = taxonomyTermsMap.get(column.data.termSetId)

      if (value) {
        const values = Array.isArray(value) ? value : [value]

        const termNames = values
          .map((v) => {
            const termGuid =
              typeof v === 'object' && 'TermGuid' in v
                ? v.TermGuid
                : typeof v === 'string'
                  ? v
                  : null

            if (termGuid) {
              const term = terms.find((t) => t.id === termGuid)
              if (term) return term.name
            }

            if (typeof v === 'object' && 'Label' in v) return v.Label

            return null
          })
          .filter(Boolean)

        transformedItem[key] = termNames.join(';')
        return
      }
    }

    if (value && typeof value === 'object' && 'Title' in value) {
      transformedItem[key] = value.Title
    }

    if (Array.isArray(value)) {
      transformedItem[key] = value.map((v) => (v.Title ? v.Title : v)).join(', ')
    }
  })

  return transformedItem
}

/** Loads the term sets referenced by taxonomy columns for label resolution. */
async function fetchTaxonomyTermsForColumns(
  columns: IListColumn[]
): Promise<Map<string, TaxonomyTermModel[]>> {
  const termSetIds = columns
    .filter((col) => col.data?.termSetId)
    .map((col) => col.data.termSetId)
    .filter((id, index, self) => self.indexOf(id) === index)

  if (termSetIds.length === 0) {
    return new Map()
  }

  try {
    const webLanguage = await SPDataAdapter.sp.web.select('Language')()
    const lcid = webLanguage.Language || 1033

    const termsMap = new Map<string, TaxonomyTermModel[]>()

    await Promise.all(
      termSetIds.map(async (termSetId) => {
        try {
          const terms = await getTermStore(SPDataAdapter.sp.web)
            .sets.getById(termSetId)
            .terms.select('*', 'localProperties')
            .all()
          const taxonomyTerms = terms.map((term) => new TaxonomyTermModel(term, termSetId, lcid))
          termsMap.set(termSetId, taxonomyTerms)
        } catch (error) {
          console.warn(`[fetchListData] Could not fetch terms for term set ${termSetId}:`, error)
        }
      })
    )

    return termsMap
  } catch (error) {
    console.warn('[fetchListData] Could not fetch web language:', error)
    return new Map()
  }
}

/** Loads list items, selected-view columns and editable field metadata from the target web. */
export async function fetchListData(
  props: IDynamicListProps,
  web: IWeb
): Promise<IDynamicListData> {
  try {
    if (!props.listName) {
      return { listItems: [], listColumns: [] }
    }

    const list = web.lists.getByTitle(props.listName)

    const allFields = await SPDataAdapter.portalDataService.getListFields(
      props.listName,
      undefined,
      web
    )

    const [listInfo, projectContentColumns, views] = await Promise.all([
      list.select('Title', 'Id', 'BaseTemplate')(),
      fetchProjectContentColumns(),
      list.views.select('Title', 'Id', 'DefaultView').filter('Hidden eq false')()
    ])

    const isDocumentLibrary = listInfo.BaseTemplate === 101

    const userFieldsQuery = getUserFieldsForQuery(allFields)

    const items = await fetchAllItemsChunked(list, userFieldsQuery, isDocumentLibrary)

    const taxonomyFields = await list.fields
      .filter("TypeAsString eq 'TaxonomyFieldType' or TypeAsString eq 'TaxonomyFieldTypeMulti'")
      .select('InternalName', 'TypeAsString', 'TermSetId')()

    const taxonomyFieldMap = new Map(
      taxonomyFields.map((field: any) => [field.InternalName, field.TermSetId as string])
    )

    let fields: any[]
    let viewToUse: string | null = null
    let sourceViewFieldNames: string[] = []

    if (props.defaultViewId && props.defaultViewId !== 'All Fields') {
      viewToUse = props.defaultViewId
    } else if (props.viewName && props.viewName !== 'All Fields') {
      viewToUse = props.viewName
    }

    if (viewToUse) {
      try {
        let view: any
        if (props.defaultViewId && props.defaultViewId !== 'All Fields') {
          view = await list.views
            .getById(props.defaultViewId)
            .select('ViewFields')
            .expand('ViewFields')()
        } else {
          view = await list.views.getByTitle(viewToUse).select('ViewFields').expand('ViewFields')()
        }

        const viewFieldNames: string[] = normalizeViewFieldNames(view.ViewFields?.Items || [])
        sourceViewFieldNames = viewFieldNames

        if (viewFieldNames.length > 0) {
          fields = viewFieldNames
            .map((fieldName: string) => allFields.find((f) => f.InternalName === fieldName))
            .filter(Boolean)
        } else {
          fields = allFields
        }
      } catch (error) {
        console.error('[fetchListData] Error fetching view fields, using all fields:', error)
        fields = allFields
      }
    } else {
      const defaultView = views.find((v) => v.DefaultView)
      if (defaultView) {
        try {
          const view: any = await list.views
            .getById(defaultView.Id)
            .select('ViewFields')
            .expand('ViewFields')()
          sourceViewFieldNames = normalizeViewFieldNames(view.ViewFields?.Items || [])
        } catch (error) {
          console.error(
            '[fetchListData] Error fetching default view fields for auto-hidden:',
            error
          )
        }
      }

      fields = allFields
    }

    const visibleAllFields = allFields.filter((field) =>
      isVisibleListField(field, projectContentColumns)
    )

    const visibleFieldNameSet = new Set(visibleAllFields.map((field) => field.InternalName))
    const sourceVisibleFieldSet = new Set(
      sourceViewFieldNames.filter((fieldName) => visibleFieldNameSet.has(fieldName))
    )

    const autoHiddenViewColumns =
      sourceVisibleFieldSet.size > 0
        ? visibleAllFields
            .map((field) => field.InternalName)
            .filter((fieldName) => !sourceVisibleFieldSet.has(fieldName))
        : []

    let columns: IListColumn[] = fields
      .filter((field) => isVisibleListField(field, projectContentColumns))
      .map((field) => {
        const dataType = mapSharePointTypeToDataType(field.TypeAsString, field.FieldTypeKind)
        const isTaxonomyField =
          field.TypeAsString === 'TaxonomyFieldType' ||
          field.TypeAsString === 'TaxonomyFieldTypeMulti'

        const termSetId = isTaxonomyField ? taxonomyFieldMap.get(field.InternalName) : undefined

        return {
          key: field.InternalName,
          name: field.Title,
          fieldName: field.InternalName,
          minWidth: undefined,
          maxWidth: undefined,
          isResizable: true,
          isSorted: false,
          isSortedDescending: false,
          dataType: dataType,
          data: {
            type: dataType,
            fieldType: field.TypeAsString,
            fieldTypeKind: field.FieldTypeKind,
            ...(isTaxonomyField && termSetId && { termSetId })
          }
        }
      })

    columns = enrichColumnsWithConfiguration(
      columns,
      projectContentColumns,
      props.useProjectContentColumnNames ?? true
    )

    const taxonomyTermsMap = await fetchTaxonomyTermsForColumns(columns)

    const listItems = items.map((item) => transformListItem(item, columns, taxonomyTermsMap))

    const mappedFields = allFields.map((fld) => new EditableSPField(fld))

    const viewsList = views.map((view) => ({
      id: view.Id,
      title: view.Title,
      isDefault: view.DefaultView
    }))

    let currentView = viewsList.find((v) => v.id === props.defaultViewId)
    if (!currentView && props.viewName && props.viewName !== 'All Fields') {
      currentView = viewsList.find((v) => v.title === props.viewName)
    }
    if (!currentView) {
      currentView = viewsList.find((v) => v.isDefault)
    }

    let filteredListItems = listItems
    let siteIdFieldMissing = false

    if (props.useSiteIdFiltering) {
      const hasGtSiteId = columns.some((col) => col.fieldName === 'GtSiteId')
      const hasGtSiteTitle = columns.some((col) => col.fieldName === 'GtSiteTitle')
      const hasBothFields = hasGtSiteId && hasGtSiteTitle

      if (!hasBothFields) {
        siteIdFieldMissing = true
      } else {
        const currentSiteId = props.siteId

        if (currentSiteId) {
          filteredListItems = listItems.filter((item) => {
            const itemSiteId = item.GtSiteId
            return itemSiteId && itemSiteId === currentSiteId
          })
        }
      }
    }

    return {
      listItems: filteredListItems,
      listColumns: columns,
      autoHiddenViewColumns,
      fields: mappedFields,
      views: viewsList,
      listTitle: listInfo.Title,
      listId: listInfo.Id,
      baseTemplate: listInfo.BaseTemplate,
      siteIdFieldMissing
    }
  } catch (error) {
    console.error('[DynamicList] fetchListData error:', error)
    throw error
  }
}

/** Loads and transforms one item for a delta update, reusing existing columns when supplied. */
export async function fetchSingleItem(
  props: IDynamicListProps,
  web: IWeb,
  itemId: number,
  existingColumns?: IListColumn[]
): Promise<any> {
  try {
    if (!props.listName) {
      throw new Error('List name is required')
    }

    const list = web.lists.getByTitle(props.listName)

    const allFields = await SPDataAdapter.portalDataService.getListFields(
      props.listName,
      undefined,
      web
    )

    const userFieldsQuery = getUserFieldsForQuery(allFields)
    const isDocumentLibrary = existingColumns?.[0]?.data?.fieldType === 'File'

    const reserved = new Set(['Author', 'Editor', 'File'])
    const userExpands = userFieldsQuery.expand.filter((name) => !reserved.has(name))

    const baseSelect = isDocumentLibrary
      ? [
          '*',
          'FileRef',
          'FileLeafRef',
          'FileDirRef',
          'File/Name',
          'File/ServerRelativeUrl',
          'File/Length',
          'FSObjType',
          'File_x0020_Type',
          'Author/Title',
          'Author/EMail',
          'Author/Id',
          'Editor/Title',
          'Editor/EMail',
          'Editor/Id'
        ]
      : [
          '*',
          'Author/Title',
          'Author/EMail',
          'Author/Id',
          'Editor/Title',
          'Editor/EMail',
          'Editor/Id'
        ]
    const baseExpand = isDocumentLibrary ? ['Author', 'Editor', 'File'] : ['Author', 'Editor']

    const item = await list.items
      .getById(itemId)
      .select(...baseSelect)
      .expand(...baseExpand)()

    if (userExpands.length > 0) {
      const chunkResults = await Promise.all(
        chunk(userExpands, MAX_USER_FIELD_EXPANDS_PER_QUERY).map((fieldNames) =>
          list.items
            .getById(itemId)
            .select('Id', ...userFieldSelects(fieldNames))
            .expand(...fieldNames)()
            .then((row: any) => ({ fieldNames, row }))
        )
      )

      for (const { fieldNames, row } of chunkResults) {
        for (const name of fieldNames) {
          item[name] = row[name]
        }
      }
    }

    let columns = existingColumns
    let taxonomyTermsMap = new Map<string, TaxonomyTermModel[]>()

    if (!columns) {
      const projectContentColumns = await fetchProjectContentColumns()

      const taxonomyFields = await list.fields
        .filter("TypeAsString eq 'TaxonomyFieldType' or TypeAsString eq 'TaxonomyFieldTypeMulti'")
        .select('InternalName', 'TypeAsString', 'TermSetId')()

      const taxonomyFieldMap = new Map(
        taxonomyFields.map((field: any) => [field.InternalName, field.TermSetId as string])
      )

      columns = allFields
        .filter((field) => {
          const showInEditForm = field.ShowInEditForm ?? true
          const hidden = field.Hidden ?? false
          return showInEditForm && !hidden
        })
        .map((field) => {
          const dataType = mapSharePointTypeToDataType(
            field.TypeAsString,
            (field as any).FieldTypeKind
          )
          const isTaxonomyField =
            field.TypeAsString === 'TaxonomyFieldType' ||
            field.TypeAsString === 'TaxonomyFieldTypeMulti'
          const termSetId = isTaxonomyField ? taxonomyFieldMap.get(field.InternalName) : undefined

          return {
            key: field.InternalName,
            name: field.Title,
            fieldName: field.InternalName,
            minWidth: undefined,
            maxWidth: undefined,
            isResizable: true,
            isSorted: false,
            isSortedDescending: false,
            dataType: dataType,
            data: {
              type: dataType,
              fieldType: field.TypeAsString,
              fieldTypeKind: (field as any).FieldTypeKind,
              ...(isTaxonomyField && termSetId && { termSetId })
            }
          }
        })

      columns = enrichColumnsWithConfiguration(
        columns,
        projectContentColumns,
        props.useProjectContentColumnNames ?? true
      )
    }

    taxonomyTermsMap = await fetchTaxonomyTermsForColumns(columns)

    return transformListItem(item, columns, taxonomyTermsMap)
  } catch (error) {
    console.error('[DynamicList] fetchSingleItem error:', error)
    throw error
  }
}
