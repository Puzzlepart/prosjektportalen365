import { IColumn } from '@fluentui/react'
import { IDynamicListProps, IDynamicListData } from '../types'
import SPDataAdapter from '../../../data'
import { EditableSPField, ProjectContentColumn } from 'pp365-shared-library'
import type { IWeb } from '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/fields'
import '@pnp/sp/items'
import '@pnp/sp/items/get-all'
import '@pnp/sp/views'
import '@pnp/sp/taxonomy'
import { TaxonomyTermModel } from '../models/TaxonomyTermModel'

/**
 * Fetches column configuration from the ProjectContentColumns (Prosjektinnholdskolonner) list.
 *
 * This function retrieves column metadata from the hub site's configuration list, which provides
 * critical information for proper column rendering including dataType, dataTypeProperties,
 * minWidth, and maxWidth values. Unlike PortfolioAggregation which filters by category,
 * this fetches all columns since DynamicList displays content from various list types.
 *
 * The configuration is used by enrichColumnsWithConfiguration to merge hub settings with
 * SharePoint field definitions.
 *
 * @returns Promise resolving to array of ProjectContentColumn configurations, or empty array if unavailable
 */
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

/**
 * Enriches SharePoint columns with configuration from ProjectContentColumns.
 *
 * This function merges hub-level column configuration with SharePoint field definitions
 * to create fully configured column objects for rendering. It performs the following:
 *
 * 1. Matches columns: Attempts to find matching ProjectContentColumn configuration by
 *    comparing internalName or fieldName
 * 2. Merges configuration: If match found, merges name, minWidth, maxWidth, dataType,
 *    and dataTypeProperties from the hub configuration
 * 3. Preserves original: If no match found, returns the SharePoint column unchanged
 *    without applying any default width values
 *
 * This ensures column widths and rendering properties come from the hub configuration
 * (Prosjektinnholdskolonner list) rather than hardcoded defaults.
 *
 * @param spColumns - Array of columns created from SharePoint field definitions
 * @param projectContentColumns - Array of column configurations from ProjectContentColumns list
 * @param useProjectContentColumnNames - Whether to use display names from ProjectContentColumns
 * @returns Array of enriched columns with merged configuration
 */
function enrichColumnsWithConfiguration(
  spColumns: IColumn[],
  projectContentColumns: ProjectContentColumn[],
  useProjectContentColumnNames: boolean = true
): IColumn[] {
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

/**
 * Maps SharePoint field type to column data type identifier.
 *
 * This function converts SharePoint field type identifiers to simplified data type
 * strings used for column rendering. It uses a two-tier mapping strategy:
 *
 * 1. Primary mapping: Checks TypeAsString (e.g., "Boolean", "DateTime") against
 *    a predefined type mapping dictionary
 * 2. Fallback mapping: If TypeAsString doesn't match, uses FieldTypeKind numeric
 *    value to determine the type
 *
 * This ensures consistent data type classification regardless of which SharePoint
 * field property is available.
 *
 * @param typeAsString - The SharePoint field's TypeAsString property (e.g., "Text", "Number")
 * @param fieldTypeKind - The SharePoint field's FieldTypeKind numeric value
 * @returns Data type string for column configuration (e.g., "text", "number", "date")
 */
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

/**
 * Transforms a raw SharePoint item into a display-ready format.
 * Applies the same transformation logic as fetchListData for consistency.
 *
 * @param item - Raw SharePoint item
 * @param columns - Column definitions with taxonomy termSetId information
 * @param taxonomyTermsMap - Map of termSetId to taxonomy terms for label resolution
 * @returns Transformed item with human-readable values
 */
export function transformListItem(
  item: any,
  columns: IColumn[],
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

/**
 * Fetches taxonomy terms for all term sets used in the columns.
 *
 * @param columns - Array of columns that may contain taxonomy fields
 * @returns Promise resolving to Map of termSetId to array of TaxonomyTermModel
 */
async function fetchTaxonomyTermsForColumns(
  columns: IColumn[]
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
          const terms = await SPDataAdapter.sp.termStore.sets
            .getById(termSetId)
            .terms.select('*', 'localProperties')()
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

/**
 * Fetches list data including items, columns, and field metadata
 * @param props Component properties
 * @param web The SharePoint web instance to use for operations
 */
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

    const itemsQuery = list.items
      .select('*', 'Author/Title', 'Editor/Title')
      .expand('Author', 'Editor')

    if (isDocumentLibrary) {
      itemsQuery
        .select(
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
          'Editor/Title'
        )
        .expand('Author', 'Editor', 'File')
    }

    const items = await itemsQuery.getAll()

    const taxonomyFields = await list.fields
      .filter("TypeAsString eq 'TaxonomyFieldType' or TypeAsString eq 'TaxonomyFieldTypeMulti'")
      .select('InternalName', 'TypeAsString', 'TermSetId')()

    const taxonomyFieldMap = new Map(
      taxonomyFields.map((field: any) => [field.InternalName, field.TermSetId as string])
    )

    let fields: any[]
    let viewToUse: string | null = null

    if (props.defaultViewId && props.defaultViewId !== 'All Fields') {
      viewToUse = props.defaultViewId
    } else if (props.viewName && props.viewName !== 'All Fields') {
      viewToUse = props.viewName
    }

    if (viewToUse) {
      try {
        let view: any
        if (props.defaultViewId && props.defaultViewId !== 'All Fields') {
          view = await list.views.getById(props.defaultViewId)()
        } else {
          view = await list.views.getByTitle(viewToUse)()
        }

        const viewFieldNames = view.ViewFields || []

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
      fields = allFields
    }

    let columns: IColumn[] = fields
      .filter((field) => {
        const showInEditForm = field.ShowInEditForm ?? true
        const hidden = field.Hidden ?? false
        const readOnlyField = field.SchemaXml
          ? field.SchemaXml.indexOf('ReadOnly="TRUE"') !== -1
          : false

        // Keep ReadOnly fields if they are defined in ProjectContentColumns
        const isInProjectContentColumns = projectContentColumns.some(
          (c) => c.internalName === field.InternalName || c.fieldName === field.InternalName
        )

        return (
          showInEditForm &&
          !hidden &&
          (!readOnlyField || isInProjectContentColumns) &&
          !field.InternalName.startsWith('_') &&
          field.InternalName !== 'Attachments'
        )
      })
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

/**
 * Fetches a single list item by ID and transforms it using the same logic as fetchListData.
 * This is useful for delta updates when creating or updating items without refetching the entire list.
 *
 * @param props Component configuration properties
 * @param itemId The ID of the item to fetch
 * @param existingColumns Optional existing column definitions to avoid refetching
 * @returns The transformed item ready for display
 */
/**
 * Fetches a single item by ID with full field data
 * @param props Component properties
 * @param web The SharePoint web instance to use for operations
 * @param itemId The ID of the item to fetch
 * @param existingColumns Optional existing columns for field type detection
 */
export async function fetchSingleItem(
  props: IDynamicListProps,
  web: IWeb,
  itemId: number,
  existingColumns?: IColumn[]
): Promise<any> {
  try {
    if (!props.listName) {
      throw new Error('List name is required')
    }

    const list = web.lists.getByTitle(props.listName)

    const itemQuery = list.items
      .getById(itemId)
      .select('*', 'Author/Title', 'Editor/Title')
      .expand('Author', 'Editor')

    const isDocumentLibrary = existingColumns?.[0]?.data?.fieldType === 'File'
    if (isDocumentLibrary) {
      itemQuery
        .select(
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
          'Editor/Title'
        )
        .expand('Author', 'Editor', 'File')
    }

    const item = await itemQuery()

    let columns = existingColumns
    let taxonomyTermsMap = new Map<string, TaxonomyTermModel[]>()

    if (!columns) {
      const allFields = await SPDataAdapter.portalDataService.getListFields(
        props.listName,
        undefined,
        web
      )

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
