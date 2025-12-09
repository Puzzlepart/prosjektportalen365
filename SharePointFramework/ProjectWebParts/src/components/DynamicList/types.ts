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

export enum DocumentLibraryViewMode {
  /**
   * Display all documents in a flat list
   */
  Flat = 'flat',
  /**
   * Display documents with folder navigation
   */
  Folders = 'folders'
}

/**
 * Column context menu configuration.
 */
export interface IColumnContextMenu {
  column: any
  target: HTMLElement
}

export interface IFileItem extends Record<string, any> {
  Id: number
  FileRef: string
  FileLeafRef: string
  File_x0020_Type?: string
  File?: {
    Length?: number
    Name?: string
    ServerRelativeUrl?: string
  }
  Modified: string
  Editor?: { Title: string }
  _UIVersionString?: string
  FSObjType?: number
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

  /**
   * Whether user has drilled down from list view to single item view
   */
  isDrilledDown?: boolean

  /**
   * Whether the list is a document library
   */
  isDocumentLibrary?: boolean

  /**
   * Current folder path for document library navigation
   */
  currentFolderPath?: string

  /**
   * Document library view mode (flat or folders)
   */
  documentViewMode?: DocumentLibraryViewMode

  /**
   * Column context menu state
   */
  columnContextMenu?: IColumnContextMenu

  /**
   * Whether edit view columns panel is open
   */
  isEditViewColumnsPanelOpen?: boolean

  /**
   * Whether Excel export is in progress
   */
  isExporting?: boolean

  /**
   * Custom column order (stored in session storage)
   */
  customColumnOrder?: number[]
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

  /**
   * List base template (101 = Document Library)
   */
  baseTemplate?: number
}
