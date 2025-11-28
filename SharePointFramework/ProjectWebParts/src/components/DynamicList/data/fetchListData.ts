import { IColumn } from '@fluentui/react'
import { IDynamicListProps, IDynamicListData } from '../types'
import SPDataAdapter from '../../../data'
import { EditableSPField } from 'pp365-shared-library'
import '@pnp/sp/lists'
import '@pnp/sp/fields'
import '@pnp/sp/items'
import '@pnp/sp/items/get-all'
import '@pnp/sp/views'

/**
 * Fetches list data including items, columns, and field metadata
 */
export async function fetchListData(props: IDynamicListProps): Promise<IDynamicListData> {
  try {
    if (!props.listName) {
      return { listItems: [], listColumns: [] }
    }

    const web = SPDataAdapter.sp.web
    const list = web.lists.getByTitle(props.listName)

    // Fetch list info
    const listInfo = await list.select('Title', 'Id')()

    // Fetch list items
    const items = await list.items
      .select('*', 'Author/Title', 'Editor/Title')
      .expand('Author', 'Editor')
      .getAll()

    // Fetch fields based on view selection
    // Priority: defaultViewId > viewName > 'All Fields'
    let fields: any[]
    let viewToUse: string | null = null

    if (props.defaultViewId && props.defaultViewId !== 'All Fields') {
      viewToUse = props.defaultViewId
    } else if (props.viewName && props.viewName !== 'All Fields') {
      viewToUse = props.viewName
    }

    if (viewToUse) {
      try {
        // Fetch fields from the selected view (by ID or Title)
        let view: any
        if (props.defaultViewId && props.defaultViewId !== 'All Fields') {
          // Fetch by ID
          console.log('[fetchListData] Fetching view by ID:', props.defaultViewId)
          view = await list.views.getById(props.defaultViewId).select('ViewFields')()
        } else {
          // Fetch by Title (backward compatibility)
          console.log('[fetchListData] Fetching view by Title:', viewToUse)
          view = await list.views.getByTitle(viewToUse).select('ViewFields')()
        }

        const viewFieldNames = view.ViewFields?.Items || []
        console.log('[fetchListData] View field names:', viewFieldNames)

        // Fetch full field metadata for the view fields
        const allFields = await list.fields.select(
          'InternalName',
          'Title',
          'TypeAsString',
          'Required',
          'Description',
          'Choices',
          'FieldTypeKind'
        )()

        // Filter to only fields in the view, maintaining view order
        fields = viewFieldNames
          .map((fieldName: string) => allFields.find((f) => f.InternalName === fieldName))
          .filter(Boolean)

        console.log('[fetchListData] Filtered fields for view:', fields.length)
      } catch (error) {
        console.error('[fetchListData] Error fetching view fields, falling back to all fields:', error)
        // Fall back to all fields if view fetch fails
        fields = await list.fields
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
      }
    } else {
      // Fetch all non-hidden, editable fields (original behavior)
      fields = await list.fields
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
    }

    // Transform fields to columns
    const columns: IColumn[] = fields
      .filter(
        (field) => !field.InternalName.startsWith('_') && field.InternalName !== 'Attachments'
      )
      .map((field) => ({
        key: field.InternalName,
        name: field.Title,
        fieldName: field.InternalName,
        minWidth: 100,
        maxWidth: 300,
        isResizable: true,
        isSorted: false,
        isSortedDescending: false,
        data: { type: field.TypeAsString }
      }))

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
    const views = await list.views
      .select('Title', 'Id', 'DefaultView')
      .filter('Hidden eq false')()

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
