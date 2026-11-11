import { DataGridProps, SortDirection, TableColumnDefinition } from '@fluentui/react-components'
import { ReactNode } from 'react'

/**
 * A column of a `DataGridList`: a Fluent UI v9 column definition plus the widths the grid sizes it
 * by. This is the shape the project list, the timeline list and the measurements dialog each
 * declared for themselves; `createDataGridColumns` produces it from an `IListColumn`.
 */
export interface IDataGridColumn<TItem = any> extends TableColumnDefinition<TItem> {
  /**
   * Narrowest the column may become, in pixels.
   */
  minWidth?: number

  /**
   * Width the column starts at, in pixels. Falls back to `minWidth`.
   */
  defaultWidth?: number
}

export interface IDataGridListProps<TItem = any> {
  /**
   * Rows to show.
   */
  items: TItem[]

  /**
   * Columns, in display order.
   */
  columns: IDataGridColumn<TItem>[]

  /**
   * Identifies a row, for selection and React keys. Defaults to the row's index.
   */
  getRowId?: (item: TItem) => string | number

  /**
   * Whether the user may sort by clicking a header. Columns sort with their own `compare`.
   */
  sortable?: boolean

  /**
   * Sort applied until the user picks another.
   */
  defaultSortState?: { sortColumn: string; sortDirection: SortDirection }

  /**
   * Whether rows can be selected, and how many at a time. Absent means no selection.
   */
  selectionMode?: 'single' | 'multiselect'

  /**
   * Ids of the rows currently selected, as `getRowId` names them.
   */
  selectedItems?: Iterable<string | number>

  /**
   * Called with the ids of the selected rows whenever the selection changes.
   */
  onSelectionChange?: (selectedItems: (string | number)[]) => void

  /**
   * Whether the selection indicator stays subtle until hovered.
   */
  subtleSelection?: boolean

  /**
   * Whether the user may resize columns. Defaults to `true`.
   */
  resizableColumns?: boolean

  /**
   * Row height.
   */
  size?: DataGridProps['size']

  /**
   * Called when a row is double-clicked, which is how the v8 list "invoked" an item.
   */
  onRowDoubleClick?: (item: TItem) => void

  /**
   * Class applied to the grid.
   */
  className?: string

  /**
   * Shown instead of the grid while there is nothing to show.
   */
  emptyContent?: ReactNode

  /**
   * Shares the container's width across the columns in proportion to their preferred widths, as
   * the v8 justified layout did, instead of starting each at its preferred width and letting the
   * grid overflow. Columns never go below their `minWidth`.
   */
  fitColumnsToContainer?: boolean
}
