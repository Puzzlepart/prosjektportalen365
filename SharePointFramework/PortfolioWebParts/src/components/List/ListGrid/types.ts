import { useArrowNavigationGroup, useTableFeatures } from '@fluentui/react-components'
import { IListColumn } from 'pp365-shared-library'
import { ReactNode, RefObject } from 'react'
import { IListGroup } from '../types'
import { useListSelection } from './useListSelection'

// Fluent does not export the types of its sizing state or of Tabster's attributes; these name them
// through the functions that return them.
type TableFeaturesState = ReturnType<typeof useTableFeatures>

export interface IListGridProps {
  /**
   * Names the grid for screen readers.
   */
  title?: string

  /**
   * Rows of the grid.
   */
  items: Record<string, any>[]

  /**
   * Columns, in display order.
   */
  columns: IListColumn[]

  /**
   * Groups of `items`. Without groups the grid is flat.
   */
  groups?: IListGroup[]

  /**
   * Show placeholder rows instead of the items while the data loads.
   */
  loading?: boolean

  /**
   * Render the rows in a compact height.
   */
  compact?: boolean

  /**
   * Share the grid's width across the columns in proportion to their preferred widths.
   */
  justified?: boolean

  /**
   * Called on a click and a right click on a column header, with the element to place a menu by.
   */
  onColumnHeaderClick?: (column: IListColumn, target: HTMLElement) => void

  /**
   * Called with the selected items whenever the selection changes.
   */
  onSelectionChange?: (selectedItems: Record<string, any>[]) => void

  /**
   * `'none'` leaves out the checks and the selection by a click on a row, for a user who may only
   * look. Defaults to `'multiselect'`.
   */
  selectionMode?: 'multiselect' | 'none'

  /**
   * The selected items, kept by the caller: the grid shows these and reports a change through
   * `onSelectionChange` without keeping a selection of its own. Without it the grid keeps its own.
   */
  selectedItems?: Record<string, any>[]

  /**
   * Class name for the grid's container.
   */
  className?: string

  /**
   * Renders a cell.
   */
  renderCell: (item: Record<string, any>, index: number, column: IListColumn) => ReactNode
}

/**
 * A row of the grid: a group's header, or an item with its index in `items`.
 */
export type ListGridEntry =
  | { type: 'group'; group: IListGroup; collapsed: boolean }
  | { type: 'item'; item: Record<string, any>; index: number }

/**
 * What `useListGrid` gives `ListGrid` to render.
 */
export interface IListGridState {
  /**
   * The grid's container, measured for the justified layout.
   */
  containerRef: RefObject<HTMLDivElement>

  /**
   * The table, measured by Fluent's column sizing.
   */
  tableRef: TableFeaturesState['tableRef']

  /**
   * Fluent's column sizing: the widths and the resize handles.
   */
  columnSizing: TableFeaturesState['columnSizing_unstable']

  /**
   * Whether the grid has groups.
   */
  isGrouped: boolean

  /**
   * The rows to render, in order.
   */
  entries: ListGridEntry[]

  /**
   * Whether every group is collapsed.
   */
  allCollapsed: boolean

  /**
   * Opens a collapsed group, or collapses an open one.
   */
  toggleCollapsed: (group: IListGroup) => void

  /**
   * Collapses every group, or opens them all when all are collapsed.
   */
  toggleAllCollapsed: () => void

  /**
   * Whether the rows can be selected (`selectionMode`).
   */
  selectable: boolean

  /**
   * The selection.
   */
  selection: ReturnType<typeof useListSelection>

  /**
   * Tabster's arrow key navigation across the grid.
   */
  arrowNavigation: ReturnType<typeof useArrowNavigationGroup>
}
