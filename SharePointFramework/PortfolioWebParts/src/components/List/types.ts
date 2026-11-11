import { SearchBoxProps } from '@fluentui/react-components'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { IFilterPanelProps, IListColumn, ListMenuItem } from 'pp365-shared-library'

export type OnColumnContextMenu = {
  column: any
  target: any
}

/**
 * A group of the list's rows: `count` items from `startIndex` in `items`, shown under `name`. The
 * items of a group are contiguous, so whoever groups sorts by the group field first.
 */
export interface IListGroup {
  /**
   * Identifies the group; its collapse state is kept by this key.
   */
  key: string

  /**
   * Shown in the group's header row.
   */
  name: string

  /**
   * Index in `items` of the group's first item.
   */
  startIndex: number

  /**
   * Number of items in the group.
   */
  count: number

  /**
   * Whether the group starts collapsed.
   */
  isCollapsed?: boolean
}

export interface IListProps<T extends IListColumn = IListColumn> {
  /**
   * Title to display in the list header
   */
  title?: string

  /**
   * Rows of the list.
   */
  items?: Record<string, any>[]

  /**
   * Column definitions. If none are provided, default columns will be an empty array.
   */
  columns?: T[]

  /**
   * Internal names of columns that should be hidden in the list.
   */
  hiddenColumns?: string[]

  /**
   * Groups of `items`, in display order. Without groups the list is flat.
   */
  groups?: IListGroup[]

  /**
   * Called with the selected items whenever the selection changes.
   */
  onSelectionChange?: (selectedItems: Record<string, any>[]) => void

  /**
   * Show placeholder rows while the data loads.
   */
  enableShimmer?: boolean

  /**
   * Render the rows in a compact height.
   */
  compact?: boolean

  /**
   * Set to true to enable add column functionality. This will render a 'new column'-column
   * with commands just like in standard SharePoint lists.
   */
  isAddColumnEnabled?: boolean

  /**
   * Render a ´ProjectInformationPanel´ component when clicking on the title column
   */
  renderTitleProjectInformationPanel?: boolean

  /**
   * Needed if `renderTitleProjectInformationPanel` is set to `true`
   */
  webPartContext?: WebPartContext

  /**
   * Properties for the search box to be rendered in the list header.
   */
  searchBox?: SearchBoxProps

  /**
   * Render list in justified layout mode: the columns share the width of the list in proportion
   * to their preferred widths, instead of each starting at its preferred width.
   */
  isListLayoutModeJustified?: boolean

  /**
   * On column context menu event is triggered on both a click and a right click on a column
   * header.
   */
  onColumnContextMenu?: ({ column, target }: OnColumnContextMenu) => void

  /**
   * Error to render in the list if the data fetch or something else fails.
   */
  error?: Error

  /**
   * Menu items to render in the Toolbar.
   */
  menuItems?: ListMenuItem[]

  /**
   * Filter panel props.
   */
  filterPanelProps?: IFilterPanelProps
}
