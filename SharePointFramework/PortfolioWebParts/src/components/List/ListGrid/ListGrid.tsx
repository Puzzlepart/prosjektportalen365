import {
  Button,
  SkeletonItem,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableSelectionCell
} from '@fluentui/react-components'
import { ChevronDownRegular, ChevronRightRegular } from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { format, getFluentIconWithFallback, IListColumn } from 'pp365-shared-library'
import React, { FC, MouseEvent } from 'react'
import styles from './ListGrid.module.scss'
import { IListGridProps } from './types'
import { useListGrid } from './useListGrid'

/**
 * Rows shown while the data loads.
 */
const PLACEHOLDER_ROWS = 8

/**
 * Whether a click landed on something in the row that does its own thing: the title's link, a
 * button, the check.
 */
function isInteractive(event: MouseEvent<HTMLElement>) {
  const target = event.target as HTMLElement
  const control = target.closest?.(
    'a, button, input, select, textarea, [role="button"], [role="link"], [role="checkbox"]'
  )
  return !!control && event.currentTarget.contains(control)
}

function sortDirection(column: IListColumn) {
  if (!column.isSorted) return undefined
  return column.isSortedDescending ? 'descending' : 'ascending'
}

/**
 * The hub's rows on Fluent UI v9's `Table`: resizable columns, groups that open and close, and a
 * selection by check or by a click on the row (as v8's list and v9's DataGrid select), with
 * shift-click ranges and a select-all. The column headers stay pinned under
 * the list's command bar while the rows scroll (`--pp-list-sticky-top`, set by `List`).
 */
export const ListGrid: FC<IListGridProps> = (props) => {
  const {
    containerRef,
    tableRef,
    columnSizing,
    isGrouped,
    entries,
    allCollapsed,
    toggleCollapsed,
    toggleAllCollapsed,
    selection,
    arrowNavigation
  } = useListGrid(props)

  const onHeaderEvent = (column: IListColumn) => (event: MouseEvent<HTMLElement>) => {
    if (event.type === 'contextmenu') event.preventDefault()
    props.onColumnHeaderClick?.(column, event.currentTarget)
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <Table
        ref={tableRef}
        {...columnSizing.getTableProps()}
        {...arrowNavigation}
        role='grid'
        aria-label={props.title}
        aria-multiselectable
        aria-busy={!!props.loading}
        noNativeElements
        sortable
        size={props.compact ? 'small' : 'medium'}
        className={styles.table}
      >
        <TableHeader className={styles.header}>
          <TableRow>
            <TableSelectionCell
              role='columnheader'
              checked={selection.allState}
              onClick={selection.toggleAll}
              checkboxIndicator={{ 'aria-label': strings.ListSelectAllLabel }}
            />
            {isGrouped && (
              <TableCell role='columnheader' className={styles.expanderCell}>
                <Button
                  appearance='transparent'
                  size='small'
                  icon={allCollapsed ? <ChevronRightRegular /> : <ChevronDownRegular />}
                  aria-label={
                    allCollapsed
                      ? strings.ListExpandAllGroupsLabel
                      : strings.ListCollapseAllGroupsLabel
                  }
                  title={
                    allCollapsed
                      ? strings.ListExpandAllGroupsLabel
                      : strings.ListCollapseAllGroupsLabel
                  }
                  onClick={toggleAllCollapsed}
                />
              </TableCell>
            )}
            {props.columns.map((column) => (
              <TableHeaderCell
                key={column.key}
                {...columnSizing.getTableHeaderCellProps(column.key)}
                sortDirection={sortDirection(column)}
                className={styles.headerCell}
                button={{
                  onClick: onHeaderEvent(column),
                  onContextMenu: onHeaderEvent(column),
                  className: styles.headerButton
                }}
              >
                {column.iconName && (
                  <span className={column.iconClassName ?? styles.headerIcon}>
                    {getFluentIconWithFallback(column.iconName, { size: 16 })}
                  </span>
                )}
                <span className={styles.headerName} title={column.name}>
                  {column.name}
                </span>
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.loading
            ? Array.from({ length: PLACEHOLDER_ROWS }, (_value, n) => (
                <TableRow key={`placeholder-${n}`} className={styles.row}>
                  <TableCell role='gridcell' className={styles.selectionPlaceholder} />
                  {isGrouped && <TableCell role='gridcell' className={styles.expanderCell} />}
                  {props.columns.map((column) => (
                    <TableCell
                      key={column.key}
                      role='gridcell'
                      {...columnSizing.getTableCellProps(column.key)}
                    >
                      <SkeletonItem className={styles.placeholder} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : entries.map((entry) =>
                entry.type === 'group' ? (
                  <TableRow key={`group-${entry.group.key}`} className={styles.groupRow}>
                    <TableSelectionCell
                      role='gridcell'
                      checked={selection.groupState(entry.group)}
                      onClick={() => selection.toggleGroup(entry.group)}
                      checkboxIndicator={{
                        'aria-label': format(strings.ListSelectGroupLabel, entry.group.name)
                      }}
                    />
                    <TableCell role='gridcell' className={styles.groupCell}>
                      <Button
                        appearance='transparent'
                        icon={entry.collapsed ? <ChevronRightRegular /> : <ChevronDownRegular />}
                        aria-expanded={!entry.collapsed}
                        onClick={() => toggleCollapsed(entry.group)}
                        className={styles.groupButton}
                      >
                        <span>{entry.group.name}</span>
                        <span className={styles.groupCount}>({entry.group.count})</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow
                    key={entry.index}
                    className={styles.row}
                    aria-selected={selection.isSelected(entry.item)}
                    appearance={selection.isSelected(entry.item) ? 'brand' : 'none'}
                    onClick={(event: MouseEvent<HTMLElement>) => {
                      if (!isInteractive(event)) selection.toggleRow(entry.item, event.shiftKey)
                    }}
                  >
                    <TableSelectionCell
                      role='gridcell'
                      checked={selection.isSelected(entry.item)}
                      onClick={(event: MouseEvent) => {
                        // The row would toggle it a second time.
                        event.stopPropagation()
                        selection.toggleRow(entry.item, event.shiftKey)
                      }}
                      checkboxIndicator={{ 'aria-label': strings.ListSelectRowLabel }}
                    />
                    {isGrouped && <TableCell role='gridcell' className={styles.expanderCell} />}
                    {props.columns.map((column) => (
                      <TableCell
                        key={column.key}
                        role='gridcell'
                        {...columnSizing.getTableCellProps(column.key)}
                      >
                        <TableCellLayout truncate>
                          {props.renderCell(entry.item, entry.index, column)}
                        </TableCellLayout>
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )}
        </TableBody>
      </Table>
    </div>
  )
}
