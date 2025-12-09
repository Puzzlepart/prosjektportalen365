import { IColumn } from '@fluentui/react'
import { IDynamicListProps, IDynamicListData } from '../types'
import SPDataAdapter from '../../../data'
import { EditableSPField, isHubSite, ProjectContentColumn } from 'pp365-shared-library'
import { Web } from '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/fields'
import '@pnp/sp/items'
import '@pnp/sp/items/get-all'
import '@pnp/sp/views'

/**
 * Gets the appropriate Web instance based on the webUrl parameter and hub site status.
 *
 * This function determines which SharePoint web instance to use for fetching list data
 * by evaluating three scenarios:
 *
 * 1. External site (webUrl provided): Creates a new Web instance for the specified URL
 *    to fetch from another site collection
 * 2. Current site is hub (no webUrl, isHubSite true): Returns the portal data service web
 *    to access hub-level data
 * 3. Current site is not hub (no webUrl, isHubSite false): Returns the standard SP web
 *    instance for the current site
 *
 * @param webUrl - Optional web URL. If provided, creates a Web instance for that URL
 * @param props - Component props containing pageContext for hub site detection
 * @returns A Web instance configured to fetch list data from the appropriate location
 */
function getWeb(webUrl?: string, props?: IDynamicListProps) {
  if (!webUrl) {
    if (props?.pageContext && isHubSite(props.pageContext)) {
      return SPDataAdapter.portalDataService.web
    }
    return SPDataAdapter.sp.web
  } else {
    return Web([SPDataAdapter.sp.web, webUrl])
  }
}

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
 * @returns Array of enriched columns with merged configuration
 */
function enrichColumnsWithConfiguration(
  spColumns: IColumn[],
  projectContentColumns: ProjectContentColumn[]
): IColumn[] {
  return spColumns.map((spColumn) => {
    const configColumn = projectContentColumns.find(
      (c) => c.internalName === spColumn.fieldName || c.fieldName === spColumn.fieldName
    )

    if (configColumn) {
      return {
        ...spColumn,
        name: configColumn.name || spColumn.name,
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
 * Fetches list data including items, columns, and field metadata
 */
export async function fetchListData(props: IDynamicListProps): Promise<IDynamicListData> {
  try {
    if (!props.listName) {
      return { listItems: [], listColumns: [] }
    }

    const web = getWeb(props.webUrl, props)
    const list = web.lists.getByTitle(props.listName)

    const [listInfo, projectContentColumns, allFields, views] = await Promise.all([
      list.select('Title', 'Id', 'BaseTemplate')(),
      fetchProjectContentColumns(),
      list.fields
        .filter('Hidden eq false and ReadOnlyField eq false')
        .select(
          'InternalName',
          'Title',
          'TypeAsString',
          'Required',
          'Description',
          'Choices',
          'FieldTypeKind',
          'DefaultValue',
          'MaxLength',
          'LookupList',
          'LookupField'
        )(),
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
          'File/Name',
          'File/ServerRelativeUrl',
          'File/Length',
          'FSObjType',
          'Author/Title',
          'Editor/Title'
        )
        .expand('Author', 'Editor', 'File')
    }

    const items = await itemsQuery.getAll()

    let fields: any[]
    let viewToUse: string | null = null

    console.log(
      '[fetchListData] Props defaultViewId:',
      props.defaultViewId,
      'viewName:',
      props.viewName
    )

    if (props.defaultViewId && props.defaultViewId !== 'All Fields') {
      viewToUse = props.defaultViewId
    } else if (props.viewName && props.viewName !== 'All Fields') {
      viewToUse = props.viewName
    }

    console.log('[fetchListData] viewToUse:', viewToUse)

    if (viewToUse) {
      try {
        let view: any
        if (props.defaultViewId && props.defaultViewId !== 'All Fields') {
          console.log('[fetchListData] Fetching view by ID:', props.defaultViewId)
          view = await list.views.getById(props.defaultViewId)()
        } else {
          console.log('[fetchListData] Fetching view by Title:', viewToUse)
          view = await list.views.getByTitle(viewToUse)()
        }

        const viewFieldNames = view.ViewFields || []
        console.log(
          '[fetchListData] View field names:',
          viewFieldNames,
          'count:',
          viewFieldNames.length
        )

        if (viewFieldNames.length > 0) {
          fields = viewFieldNames
            .map((fieldName: string) => allFields.find((f) => f.InternalName === fieldName))
            .filter(Boolean)
          console.log('[fetchListData] Filtered fields for view:', fields.length)
        } else {
          console.log('[fetchListData] View has no fields, using all fields')
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
      .filter(
        (field) => !field.InternalName.startsWith('_') && field.InternalName !== 'Attachments'
      )
      .map((field) => {
        const dataType = mapSharePointTypeToDataType(field.TypeAsString, field.FieldTypeKind)
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
            fieldTypeKind: field.FieldTypeKind
          }
        }
      })

    console.log(
      '[fetchListData] Enriching columns with ProjectContentColumns configuration:',
      projectContentColumns.length
    )
    columns = enrichColumnsWithConfiguration(columns, projectContentColumns)

    const listItems = items.map((item) => {
      const transformedItem: Record<string, any> = { ...item }

      Object.keys(item).forEach((key) => {
        const value = item[key]

        if (value && typeof value === 'object' && 'Title' in value) {
          transformedItem[key] = value.Title
        }

        if (Array.isArray(value)) {
          transformedItem[key] = value.map((v) => (v.Title ? v.Title : v)).join(', ')
        }
      })

      return transformedItem
    })

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

    return {
      listItems,
      listColumns: columns,
      fields: mappedFields,
      views: viewsList,
      listTitle: listInfo.Title,
      listId: listInfo.Id,
      baseTemplate: listInfo.BaseTemplate
    }
  } catch (error) {
    console.error('[DynamicList] fetchListData error:', error)
    throw error
  }
}
