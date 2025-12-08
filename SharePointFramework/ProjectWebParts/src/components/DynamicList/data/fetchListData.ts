import { IColumn } from '@fluentui/react'
import { IDynamicListProps, IDynamicListData } from '../types'
import SPDataAdapter from '../../../data'
import { EditableSPField, isHubSite } from 'pp365-shared-library'
import { Web } from '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/fields'
import '@pnp/sp/items'
import '@pnp/sp/items/get-all'
import '@pnp/sp/views'

/**
 * Get the appropriate web instance based on webUrl and pageContext
 * @param webUrl Optional web URL. If not provided, checks if current site is hub. If another URL, creates Web instance.
 * @param props Component props containing pageContext
 */
function getWeb(webUrl?: string, props?: IDynamicListProps) {
  if (!webUrl) {
    // Check if current site is the hub site
    if (props?.pageContext && isHubSite(props.pageContext)) {
      // Current site is hub, use portal data service
      return SPDataAdapter.portalDataService.web
    }
    // Current site is not hub
    return SPDataAdapter.sp.web
  } else {
    // Another site URL - create Web instance
    return Web([SPDataAdapter.sp.web, webUrl])
  }
}

/**
 * Maps SharePoint field type to our column data type
 */
function mapSharePointTypeToDataType(typeAsString: string, fieldTypeKind: number): string {
  // Map based on TypeAsString first
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

  // Fallback based on FieldTypeKind
  switch (fieldTypeKind) {
    case 2: // Integer
    case 9: // Number
    case 10: // Currency
      return 'number'
    case 4: // DateTime
      return 'date'
    case 8: // Boolean
      return 'boolean'
    case 20: // User
      return 'user'
    case 7: // Lookup
      return 'text'
    case 6: // Choice
    case 15: // MultiChoice
      return 'choice'
    case 11: // URL
      return 'url'
    case 3: // Note (multiline)
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

    // Fetch list info
    const listInfo = await list.select('Title', 'Id')()

    // Fetch list items
    const items = await list.items
      .select('*', 'Author/Title', 'Editor/Title')
      .expand('Author', 'Editor')
      .getAll()

    // Always fetch all fields first
    const allFields = await list.fields
      .filter('Hidden eq false and ReadOnlyField eq false')
      .select(
        'InternalName',
        'Title',
        'TypeAsString',
        'Required',
        'Description',
        'Choices',
        'FieldTypeKind'
      )()

    // Determine which fields to display based on view selection
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
        // Fetch view field names
        let view: any
        if (props.defaultViewId && props.defaultViewId !== 'All Fields') {
          // Fetch by ID
          console.log('[fetchListData] Fetching view by ID:', props.defaultViewId)
          view = await list.views.getById(props.defaultViewId)()
        } else {
          // Fetch by Title (backward compatibility)
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

        // Filter all fields to only those in the view, maintaining view order
        if (viewFieldNames.length > 0) {
          fields = viewFieldNames
            .map((fieldName: string) => allFields.find((f) => f.InternalName === fieldName))
            .filter(Boolean)
          console.log('[fetchListData] Filtered fields for view:', fields.length)
        } else {
          // If view has no fields, use all fields
          console.log('[fetchListData] View has no fields, using all fields')
          fields = allFields
        }
      } catch (error) {
        console.error('[fetchListData] Error fetching view fields, using all fields:', error)
        // Fall back to all fields if view fetch fails
        fields = allFields
      }
    } else {
      // Use all fields when no specific view is selected
      fields = allFields
    }

    // Transform fields to columns
    const columns: IColumn[] = fields
      .filter(
        (field) => !field.InternalName.startsWith('_') && field.InternalName !== 'Attachments'
      )
      .map((field) => {
        const dataType = mapSharePointTypeToDataType(field.TypeAsString, field.FieldTypeKind)
        return {
          key: field.InternalName,
          name: field.Title,
          fieldName: field.InternalName,
          minWidth: 100,
          maxWidth: 300,
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

    // Transform items for display
    const listItems = items.map((item) => {
      const transformedItem: Record<string, any> = { ...item }

      // Handle lookup fields, person fields, etc.
      Object.keys(item).forEach((key) => {
        const value = item[key]

        // Handle person/group fields
        if (value && typeof value === 'object' && 'Title' in value) {
          transformedItem[key] = value.Title
        }

        // Handle multi-value fields
        if (Array.isArray(value)) {
          transformedItem[key] = value.map((v) => (v.Title ? v.Title : v)).join(', ')
        }
      })

      return transformedItem
    })

    // Fetch all editable fields for CustomEditPanel
    const editableFields = await list.fields
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
      )()

    // Map to EditableSPField instances
    const mappedFields = editableFields.map((fld) => new EditableSPField(fld))

    // Fetch available views
    const views = await list.views.select('Title', 'Id', 'DefaultView').filter('Hidden eq false')()

    const viewsList = views.map((view) => ({
      id: view.Id,
      title: view.Title,
      isDefault: view.DefaultView
    }))

    // Find current view
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
      listId: listInfo.Id
    }
  } catch (error) {
    console.error('[DynamicList] fetchListData error:', error)
    throw error
  }
}
