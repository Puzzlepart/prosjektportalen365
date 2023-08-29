import { IColumn, IScrollablePaneProps, IShimmeredDetailsListProps, Target } from '@fluentui/react'
import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'
import { SearchBoxProps } from '@fluentui/react-search-preview'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { IFilterPanelProps } from 'pp365-shared-library'
import { CSSProperties, MouseEventHandler } from 'react'

export type OnColumnContextMenu = {
  column: any
  target: Target
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
  menuItems?: IListMenuItem[]

  /**
   * Filter panel props.
   */
  filterPanelProps?: IFilterPanelProps
}

/**
 * Represents a menu item in a list.
 */
export interface IListMenuItem {
  /**
   * The text to display in the menu item.
   */
  text?: string

  /**
   * The name of the menu item.
   */
  name?: string

  /**
   * The value of the menu item if it is a MenuItemCheckbox
   */
  value?: string

  /**
   * The icon to display in the menu item. Could either be a
   * `FluentIcon` or a string representing the icon name. Then
   * the `<Icon />` component from `@fluentui/react`
   * will be used.
   */
  icon?: FluentIcon | string

  /**
   * On click event handler.
   */
  onClick?: MouseEventHandler<any>

  /**
   * Disabled state.
   */
  disabled?: boolean

  /**
   * Checked state.
   */
  checkedValues?: Record<string, string[]>

  /**
   * The type of the menu item.
   */
  type?: 'divider' | 'header' | 'default'

  /**
   * Custom width of the menu item.
   */
  width?: string | number

  /**
   * Custom style of the menu item.
   */
  style?: CSSProperties

  /**
   * Items to render in a sub menu.
   */
  items?: IListMenuItem[]
}
