import {
  createTableColumn,
  TableColumnSizingOptions,
  useArrowNavigationGroup,
  useTableColumnSizing_unstable,
  useTableFeatures
} from '@fluentui/react-components'
import { fitColumnWidths, IListColumn } from 'pp365-shared-library'
import { useContainerWidth } from 'pp365-shared-library/lib/components/DataGridList/useContainerWidth'
import { useCallback, useMemo, useRef, useState } from 'react'
import { IListGroup } from '../types'
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
 * Sizing options from the columns: each starts at its preferred width (`maxWidth`, else
 * `minWidth`) as in v8's fixed layout, or, justified, at its share of the grid's width.
 */
function createColumnSizingOptions(
  columns: IListColumn[],
  justifiedWidth?: number
): TableColumnSizingOptions {
  const sized = columns.map((column) => ({
    ...createTableColumn({ columnId: column.key }),
    minWidth: column.minWidth,
    defaultWidth: column.maxWidth ?? column.minWidth
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
 * Component logic hook for `ListGrid`: the column sizing, the groups with their collapse state, the
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
  const columnSizingOptions = useMemo(
    () =>
      createColumnSizingOptions(columns, justified ? containerWidth - fixedCellsWidth : undefined),
    [columns, justified, containerWidth, fixedCellsWidth]
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

  return {
    containerRef,
    tableRef,
    columnSizing,
    isGrouped,
    entries,
    allCollapsed,
    toggleCollapsed,
    toggleAllCollapsed,
    selectable,
    selection,
    arrowNavigation
  }
}
