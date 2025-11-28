import { IColumn } from '@fluentui/react'
import {
  EditableSPField,
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState,
  ICustomEditPanelProps,
  IFilterProps
} from 'pp365-shared-library'

export enum DynamicListMode {
  /**
   * Display multiple items in a grid
   */
  Multi = 'multi',
  /**
   * Display a single item with full field view
   */
  Single = 'single'
}

export interface IDynamicListProps extends IBaseWebPartComponentProps {
  /**
   * The URL of the site where the list is located.
   * If not specified, uses the current site.
   */
  webUrl?: string

  /**
   * The name of the SharePoint list to display
   */
  listName?: string

  /**
   * The name of the view to use for field selection.
   * If not specified or set to 'All Fields', uses all list fields.
   */
  viewName?: string

  /**
   * Default view ID (the SharePoint item ID).
   * Takes precedence over viewName if specified.
   */
  defaultViewId?: string

  /**
   * Show search box
   */
  showSearchBox?: boolean

  /**
   * Show view selector in toolbar
   */
  showViewSelector?: boolean

  /**
   * Whether to show the command bar with actions
   */
  showCommandBar?: boolean

  /**
   * Whether to show filter panel
   */
  showFilters?: boolean

  /**
   * Number of items to show per page
   */
  pageSize?: number

  /**
   * Additional info text to display
   */
  infoText?: string

  /**
   * Maximum number of items allowed in the list (0 = unlimited)
   */
  maxItems?: number

  /**
   * Display mode: 'multi' for grid view, 'single' for detailed single-item view
   */
  mode?: DynamicListMode
}

export interface IDynamicListState extends IBaseWebPartComponentState<IDynamicListData> {
  /**
   * Loading state
   */
  isLoading?: boolean

  /**
   * Show filter panel
   */
  showFilterPanel?: boolean

  /**
   * Filters
   */
  filters?: IFilterProps[]

  /**
   * Active filters
   */
  activeFilters: Record<string, string[]>

  /**
   * Filtered data
   */
  filteredData?: IDynamicListData

  /**
   * Selected items (multi-select mode)
   */
  selectedItems?: any[]

  /**
   * Selected item (single-item view mode)
   */
  selectedItem?: Record<string, any>

  /**
   * Indicates if data is being refetched
   */
  isRefetching?: boolean

  /**
   * Timestamp for refetch. Changing this state variable refetches the data
   */
  refetch?: number

  /**
   * Search term for filtering items
   */
  searchTerm?: string

  /**
   * Current selected view
   */
  currentView?: { id: string; title: string; isDefault?: boolean }

  /**
   * Available views for the list
   */
  views?: Array<{ id: string; title: string; isDefault?: boolean }>

  /**
   * Whether view is currently being changed
   */
  isChangingView?: boolean

  /**
   * Panel for editing or creating new items
   */
  panel?: Partial<ICustomEditPanelProps>
}

export interface IDynamicListData {
  /**
   * List items to display in the grid
   */
  listItems: Record<string, any>[]

  /**
   * Columns configuration for the grid
   */
  listColumns: IColumn[]

  /**
   * Editable fields metadata
   */
  fields?: EditableSPField[]

  /**
   * List title
   */
  listTitle?: string

  /**
   * List ID
   */
  listId?: string

  /**
   * Available views
   */
  views?: Array<{ id: string; title: string; isDefault?: boolean }>
}
