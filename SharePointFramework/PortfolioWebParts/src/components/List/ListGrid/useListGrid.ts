import {
  createTableColumn,
  TableColumnSizingOptions,
  useArrowNavigationGroup,
  useRestoreFocusTarget,
  useTableColumnSizing_unstable,
  useTableFeatures
} from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { fitColumnWidths, format, IListColumn } from 'pp365-shared-library'
import { useContainerWidth } from 'pp365-shared-library/lib/components/DataGridList/useContainerWidth'
import {
  cloneElement,
  isValidElement,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState
} from 'react'
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

  // A header that opens the column menu says so, and is where the focus returns when the menu
  // or a panel it opened closes: the menu opens from state, with no trigger of Fluent's.
  const restoreFocusTarget = useRestoreFocusTarget()
  const headerMenuProps = props.headerOpensMenu
    ? { 'aria-haspopup': 'menu' as const, ...restoreFocusTarget }
    : {}

  // The handle at a header's edge, named in the page's language: Fluent names it «Resize column»
  // and its value «… pixels», in English. A screen reader reads them once «Endre kolonnebredde»
  // in the column menu has put the focus on the handle.
  const getHeaderCellProps = (column: IListColumn) => {
    const { aside, ...cellProps } = columnSizing.getTableHeaderCellProps(column.key)
    if (!isValidElement(aside)) return cellProps
    const width = columnSizing.getColumnWidths().find((c) => c.columnId === column.key)?.width ?? 0
    return {
      ...cellProps,
      aside: cloneElement(aside as ReactElement<Record<string, unknown>>, {
        'aria-label': format(strings.ColumnResizeHandleLabel, column.name),
        'aria-valuetext': format(strings.ColumnWidthValueText, Math.round(width))
      })
    }
  }

  // For the column menu: the arrow keys then change the column's width, as a drag on its header's
  // edge does, and Enter or Escape hands the focus back to the header (WCAG 2.1.1). A column
  // without a handle (the last one, when the grid fills its width) cannot be resized at all.
  const resizeColumn = (column: IListColumn): ResizeColumn | undefined =>
    columnSizing.getTableHeaderCellProps(column.key).aside
      ? (event) => columnSizing.enableKeyboardMode(column.key)(event)
      : undefined

  return {
    headerMenuProps,
    containerRef,
    tableRef,
    columnSizing,
    getHeaderCellProps,
    resizeColumn,
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
