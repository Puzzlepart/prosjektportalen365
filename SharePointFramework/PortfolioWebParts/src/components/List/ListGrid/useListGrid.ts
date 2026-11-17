import {
  createTableColumn,
  TableColumnSizingOptions,
  useArrowNavigationGroup,
  useRestoreFocusTarget,
  useTableColumnSizing_unstable,
  useTableFeatures
} from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { fitColumnWidths, format, IListColumn, nameColumnResizeHandle } from 'pp365-shared-library'
import { useContainerWidth } from 'pp365-shared-library/lib/components/DataGridList/useContainerWidth'
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { IListGroup, ResizeColumn } from '../types'
import { IListGridProps, IListGridState, ListGridEntry } from './types'
import { useListSelection } from './useListSelection'

/**
 * Width of Fluent's selection cell (`CELL_WIDTH` in `@fluentui/react-table`, not exported).
 */
export const SELECTION_CELL_WIDTH = 44

/**
 * Width of the cell that holds the groups' expand and collapse buttons.
 */
export const EXPANDER_CELL_WIDTH = 32

/**
 * Identifies a group for its collapse state. A new grouping reuses the keys (`Group_0`, ...), so
 * the name is part of it.
 */
function groupId(group: IListGroup) {
  return `${group.key}\u0000${group.name}`
}

/**
 * The larger of two widths, leaving out one that is not a number; undefined when neither is.
 */
function widerOf(width: number | undefined, other: number | undefined): number | undefined {
  if (!Number.isFinite(other)) return width
  if (!Number.isFinite(width)) return other
  return Math.max(width, other)
}

/**
 * Sizing options from the columns: each starts at its preferred width (`maxWidth`, else
 * `minWidth`) as in v8's fixed layout, or, justified, at its share of the grid's width, and is
 * never narrower than its least width (`leastWidths`, in the columns' order).
 */
function createColumnSizingOptions(
  columns: IListColumn[],
  leastWidths: Array<number | undefined>,
  justifiedWidth?: number
): TableColumnSizingOptions {
  const sized = columns.map((column, index) => ({
    ...createTableColumn({ columnId: column.key }),
    minWidth: leastWidths[index],
    // Not below the minimum: Fluent takes a new ideal width as is for a column it already sizes.
    defaultWidth: widerOf(column.maxWidth ?? column.minWidth, leastWidths[index])
  }))
  if (justifiedWidth !== undefined) return fitColumnWidths(sized, justifiedWidth)
  return sized.reduce<TableColumnSizingOptions>(
    (options, column) => ({
      ...options,
      [column.columnId]: {
        minWidth: column.minWidth,
        defaultWidth: column.defaultWidth,
        idealWidth: column.defaultWidth
      }
    }),
    {}
  )
}

/**
 * Component logic hook for `ListGrid`: the column sizing, with the least widths the columns' data
 * needs, what a column's header shows under its name, the groups with their collapse state, the
 * rows to show and the selection.
 *
 * The groups' collapse state is the grid's own, started from each group's `isCollapsed`; the
 * user's choices are kept per group while the list is filtered or searched, until
 * `collapseStateKey` changes.
 */
export function useListGrid(props: IListGridProps): IListGridState {
  const { items, columns, groups, justified } = props
  const isGrouped = !!groups && groups.length > 0
  const selectable = props.selectionMode !== 'none'

  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef, justified)
  const fixedCellsWidth =
    (selectable ? SELECTION_CELL_WIDTH : 0) + (isGrouped ? EXPANDER_CELL_WIDTH : 0)
  // Each column's least width: its `minWidth`, raised to what its data needs where that is more
  // (the status report column's strip). The overview puts a column's data on the column object and
  // keeps the columns array, so the options are keyed on these widths, as text. Never on a
  // function made anew on each render: every new options object makes Fluent size the columns
  // and render again, and puts back the widths the user dragged.
  const leastWidths = columns.map((column) =>
    widerOf(column.minWidth, props.getColumnMinWidth?.(column))
  )
  const leastWidthsKey = leastWidths.join(',')
  const columnSizingOptions = useMemo(
    () =>
      createColumnSizingOptions(
        columns,
        leastWidths,
        justified ? containerWidth - fixedCellsWidth : undefined
      ),
    [columns, leastWidthsKey, justified, containerWidth, fixedCellsWidth]
  )
  const tableColumns = useMemo(
    () => columns.map((column) => createTableColumn({ columnId: column.key })),
    [columns]
  )
  const { columnSizing_unstable: columnSizing, tableRef } = useTableFeatures(
    { columns: tableColumns, items: [] },
    [
      useTableColumnSizing_unstable({
        columnSizingOptions,
        autoFitColumns: !!justified,
        containerWidthOffset: -fixedCellsWidth
      })
    ]
  )

  // The user's choices, kept with the key they were made under: under a new key there are none.
  const { collapseStateKey } = props
  const [collapseState, setCollapseState] = useState<{
    key: typeof collapseStateKey
    toggled: Record<string, boolean>
  }>({ key: collapseStateKey, toggled: {} })
  const toggled = collapseState.key === collapseStateKey ? collapseState.toggled : {}
  const setToggled = useCallback(
    (next: (previous: Record<string, boolean>) => Record<string, boolean>) =>
      setCollapseState((previous) => ({
        key: collapseStateKey,
        toggled: next(previous.key === collapseStateKey ? previous.toggled : {})
      })),
    [collapseStateKey]
  )
  const isCollapsed = useCallback(
    (group: IListGroup) => toggled[groupId(group)] ?? !!group.isCollapsed,
    [toggled]
  )
  const toggleCollapsed = useCallback(
    (group: IListGroup) =>
      setToggled((previous) => ({
        ...previous,
        [groupId(group)]: !(previous[groupId(group)] ?? !!group.isCollapsed)
      })),
    [setToggled]
  )
  const allCollapsed = isGrouped && groups.every(isCollapsed)
  const toggleAllCollapsed = useCallback(
    () =>
      setToggled((previous) => ({
        ...previous,
        ...Object.fromEntries(groups.map((group) => [groupId(group), !allCollapsed]))
      })),
    [groups, allCollapsed, setToggled]
  )

  const entries = useMemo<ListGridEntry[]>(() => {
    const itemEntry = (index: number): ListGridEntry => ({
      type: 'item',
      item: items[index],
      index
    })
    if (!isGrouped) return items.map((_item, index) => itemEntry(index))
    return groups.flatMap((group) => {
      const collapsed = isCollapsed(group)
      const header: ListGridEntry = { type: 'group', group, collapsed }
      if (collapsed) return [header]
      const indices = Array.from({ length: group.count }, (_value, n) => group.startIndex + n)
      return [header, ...indices.filter((index) => index < items.length).map(itemEntry)]
    })
  }, [items, groups, isGrouped, isCollapsed])

  const visibleItems = useMemo(
    () => entries.flatMap((entry) => (entry.type === 'item' ? [entry.item] : [])),
    [entries]
  )
  const selection = useListSelection(
    items,
    visibleItems,
    props.onSelectionChange,
    props.selectedItems
  )

  // One tab stop for the grid, the arrow keys between its checks, links and header buttons, as in
  // v8's list and Fluent's DataGrid.
  const arrowNavigation = useArrowNavigationGroup({ axis: 'grid' })

  // A header that opens the column menu says so, and is where the focus returns when the menu
  // or a panel it opened closes: the menu opens from state, with no trigger of Fluent's.
  const restoreFocusTarget = useRestoreFocusTarget()
  const headerMenuProps = props.headerOpensMenu
    ? { 'aria-haspopup': 'menu' as const, ...restoreFocusTarget }
    : {}

  // The handle at a header's edge, named in the page's language: Fluent names it «Resize column»
  // and its value «… pixels», in English. A screen reader reads them once «Endre kolonnebredde»
  // in the column menu has put the focus on the handle. Shared with the dynamic list's table.
  const getHeaderCellProps = (column: IListColumn) => {
    const width = columnSizing.getColumnWidths().find((c) => c.columnId === column.key)?.width ?? 0
    return nameColumnResizeHandle(
      columnSizing.getTableHeaderCellProps(column.key),
      column.name,
      width
    )
  }

  // What renders nothing is undefined here, so a header without an addon keeps its markup and
  // styles exactly.
  const getHeaderAddon = (column: IListColumn): ReactNode => {
    const addon = props.renderHeaderAddon?.(column)
    return addon == null || typeof addon === 'boolean' ? undefined : addon
  }

  // For the column menu: the arrow keys then change the column's width, as a drag on its header's
  // edge does, and Enter or Escape hands the focus back to the header (WCAG 2.1.1). A column
  // without a handle (the last one, when the grid fills its width) cannot be resized at all.
  const resizeColumn = (column: IListColumn): ResizeColumn | undefined =>
    columnSizing.getTableHeaderCellProps(column.key).aside
      ? (event) => columnSizing.enableKeyboardMode(column.key)(event)
      : undefined

  // As «Velg rad» alone, every row's check read the same, and the down arrow in that column told
  // nothing (Puzzlepart/prosjektportalen365-testing#137).
  const selectRowLabel = (item: Record<string, any>) => {
    const name = String((props.getRowName ? props.getRowName(item) : item?.Title) ?? '').trim()
    return name ? format(strings.ListSelectNamedRowLabel, name) : strings.ListSelectRowLabel
  }

  return {
    headerMenuProps,
    containerRef,
    tableRef,
    columnSizing,
    getHeaderCellProps,
    getHeaderAddon,
    resizeColumn,
    isGrouped,
    entries,
    allCollapsed,
    toggleCollapsed,
    toggleAllCollapsed,
    selectable,
    selection,
    selectRowLabel,
    arrowNavigation
  }
}
