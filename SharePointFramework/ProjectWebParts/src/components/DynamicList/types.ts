import {
  EditableSPField,
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState,
  ICustomEditPanelProps,
  IFilterProps,
  IListColumn
} from 'pp365-shared-library'

/** Chooses between the list and detailed item views. */
export enum DynamicListMode {
  Multi = 'multi',
  Single = 'single'
}

/** Chooses flat files or folder navigation for a document library. */
export enum DocumentLibraryViewMode {
  Flat = 'flat',
  Folders = 'folders'
}

/** Determines which site's list the web part reads and modifies. */
export enum WebContextMode {
  CurrentProject = 'current',
  HubSite = 'hub',
  CustomSite = 'custom'
}

/**
 * Custom action types for CommandBar actions
 */
export enum CustomActionType {
  /**
   * Trigger action - sends POST request to hookUrl with selected item data
   */
  Trigger = 'Trigger',
  /**
   * Dialog action - sends POST request to hookUrl, polls for result, and displays iframe content
   */
  Dialog = 'Dialog'
}

/**
 * Custom action configuration for CommandBar
 */
export interface ICustomAction {
  /**
   * Name of the action (displayed as button text)
   */
  name: string

  icon?: string

  description?: string

  actionType: CustomActionType | string

  /**
   * URL to POST to (required for Trigger action type and Dialog action type for polling)
   */
  hookUrl?: string

  /**
   * iframe content/snippet (optional - can be provided upfront or fetched via polling for Dialog type)
   */
  iframeContent?: string

  /**
   * Sort order for the action (lower numbers appear first)
   */
  order?: number
}

/** File and folder metadata used by the document library view. */
export interface IFileItem extends Record<string, any> {
  Id: number
  FileRef: string
  FileLeafRef: string
  FileDirRef: string
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

/** Configures the list source, views, fields and available actions. */
export interface IDynamicListProps extends IBaseWebPartComponentProps {
  webContextMode?: WebContextMode

  /**
   * The URL of the site where the list is located.
   * Only used when webContextMode is 'custom'.
   */
  webUrl?: string

  listName?: string

  /**
   * The name of the view to use for field selection.
   * If not specified or set to 'All Fields', uses all list fields.
   */
  viewName?: string

  /**
   * SharePoint view GUID used for initial field selection.
   * Takes precedence over viewName if specified.
   */
  defaultViewId?: string

  /**
   * Array of internal field names to hide from the edit panel.
   * If specified, these fields will be excluded when creating or editing items.
   * Required fields will still be shown even if listed here.
   * If empty or not specified, shows all fields in the edit panel.
   */
  hiddenColumns?: string[]

  /**
   * Array of internal field names to hide from the list view.
   * If specified, these columns will be excluded from the table display.
   * If empty or not specified, shows all columns from the selected view or all fields.
   */
  hiddenViewColumns?: string[]

  /**
   * Array of internal field names that should NOT be filterable.
   * If specified, these columns will be excluded from filter generation.
   * By default, Note, Date, and Number fields are good candidates to disable.
   */
  nonFilterableColumns?: string[]

  /**
   * All available columns from the selected list (internal names).
   * Populated automatically when a list is selected.
   */
  availableColumns?: string[]

  /**
   * Custom column order configuration. Allows overriding the default column order from the view.
   * Array of column internal names in the desired display order.
   * Columns not specified here will appear after the specified ones in their default order.
   */
  columnOrder?: string[]

  /**
   * Minimum height for the component container.
   * Overrides the default min-height CSS value.
   * Can be specified as a number (pixels) or string with units (e.g., '500px', '50vh').
   */
  minHeight?: number | string

  /**
   * Enable filtering based on GtSiteId field.
   * When enabled, only items matching the current site's ID will be displayed.
   * Requires GtSiteId field to exist on the list/library.
   */
  useSiteIdFiltering?: boolean

  /**
   * For document libraries: Create and use a project-specific folder.
   * When enabled, creates a folder named after the site title and uses it as root when creating/uploading a file
   * if there is not already a project-specific folder at the current location.
   * All operations (upload, new files) will target this folder.
   */
  useProjectFolder?: boolean

  showSearchBox?: boolean

  showViewSelector?: boolean

  showCommandBar?: boolean

  showFilters?: boolean

  /**
   * Whether to use column display names from ProjectContentColumns configuration.
   * If true, uses names from Prosjektinnholdskolonner list.
   * If false, uses names directly from the SharePoint list/library.
   */
  useProjectContentColumnNames?: boolean

  infoText?: string

  mode?: DynamicListMode

  documentLibraryViewMode?: DocumentLibraryViewMode

  showNewButton?: boolean

  showEditButton?: boolean

  showDeleteButton?: boolean

  showRefreshButton?: boolean

  showExportButton?: boolean

  /**
   * For document libraries: Show/hide the Upload File option
   */
  showUploadButton?: boolean

  /**
   * For document libraries: Show/hide the New Word Document option
   */
  showNewWordButton?: boolean

  /**
   * For document libraries: Show/hide the New Excel Document option
   */
  showNewExcelButton?: boolean

  /**
   * For document libraries: Show/hide the New PowerPoint Document option
   */
  showNewPowerPointButton?: boolean

  /**
   * Show/hide the View Mode toggle (Flat/Folder view for document libraries)
   */
  showViewModeToggle?: boolean

  showItemTitle?: boolean

  showCustomActions?: boolean

  customActions?: ICustomAction[]
}

/** Loaded list data, navigation, selection and pending operations. */
export interface IDynamicListState extends Omit<
  IBaseWebPartComponentState<IDynamicListData>,
  'error'
> {
  /**
   * Message of a failed fetch, shown in place of the list
   */
  error?: string

  isLoading?: boolean

  showFilterPanel?: boolean

  filters?: IFilterProps[]

  activeFilters: Record<string, string[]>

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

  searchTerm?: string

  currentView?: { id: string; title: string; isDefault?: boolean }

  views?: Array<{ id: string; title: string; isDefault?: boolean }>

  isChangingView?: boolean

  panel?: Partial<ICustomEditPanelProps>

  /**
   * Whether user has drilled down from list view to single item view
   */
  isDrilledDown?: boolean

  isDocumentLibrary?: boolean

  currentFolderPath?: string

  /**
   * Document library view mode (flat or folders)
   */
  documentLibraryViewMode?: DocumentLibraryViewMode

  isExporting?: boolean

  permissions?: {
    canAdd: boolean
    canEdit: boolean
    canDelete: boolean
  }
}

/** List items and metadata needed by the table, filters and edit panel. */
export interface IDynamicListData {
  listItems: Record<string, any>[]

  listColumns: IListColumn[]

  /**
   * Columns that should be hidden by default because they are not present
   * in the configured/source SharePoint view (configured view or default view fallback).
   */
  autoHiddenViewColumns?: string[]

  fields?: EditableSPField[]

  listTitle?: string

  listId?: string

  views?: Array<{ id: string; title: string; isDefault?: boolean }>

  /**
   * List base template (101 = Document Library)
   */
  baseTemplate?: number

  /**
   * Warning message if Site ID filtering is enabled but GtSiteId field is missing
   */
  siteIdFieldMissing?: boolean
}
