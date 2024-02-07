import { IColumn, IScrollablePaneProps, IShimmeredDetailsListProps } from '@fluentui/react'
import { SearchBoxProps } from '@fluentui/react-search-preview'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { IFilterPanelProps } from 'pp365-shared-library'
import { ListMenuItem } from 'pp365-shared-library'

export type OnColumnContextMenu = {
  column: any
  target: any
}

export interface IListProps<T extends IColumn = IColumn>
  extends Omit<
    IShimmeredDetailsListProps,
    'layoutMode' | 'onColumnHeaderClick' | 'onColumnHeaderContextMenu'
  > {
  /**
   * Title to display in the list header
   */
  title?: string

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
   * Layer host id
   */
  layerHostId?: string

  /**
   * Scrollable pane props. This is read-only and can't be changed.
   */
  readonly scrollablePane?: IScrollablePaneProps

  /**
   * Properties for the search box to be rendered in the list header.
   */
  searchBox?: SearchBoxProps

  /**
   * Render list in justified layout mode. Manages which columns are visible, tries
   * to size them according to their min/max rules and drops  off columns that can't
   * fit and have isCollapsible set.
   */
  isListLayoutModeJustified?: boolean

  /**
   * On column context menu event is triggered on both `onColumnHeaderClick`
   * and `onColumnHeaderContextMenu`.
   */
  onColumnContextMenu?: ({ column, target }: OnColumnContextMenu) => void

  /**
   * Column definitions. If none are provided, default columns will be an empty array.
   */
  columns?: T[]

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
