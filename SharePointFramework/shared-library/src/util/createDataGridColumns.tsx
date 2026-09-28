import {
  TableCellLayout,
  TableColumnDefinition,
  TableColumnSizingOptions,
  createTableColumn
} from '@fluentui/react-components'
import React from 'react'
import { IListColumn } from '../types'

export interface IDataGridColumns<TItem> {
  /**
   * Column definitions for `DataGrid`.
   */
  columns: TableColumnDefinition<TItem>[]

  /**
   * Sizing options for `DataGrid`, keyed by column, from each column's `minWidth` and `maxWidth`.
   */
  columnSizingOptions: TableColumnSizingOptions
}

/**
 * Turns the solutions' own column descriptions into what the Fluent UI v9 `DataGrid` takes.
 *
 * `IListColumn` is the shape the data adapters, the column forms and the v8 list hub share. Lists
 * that need none of the hub's grouping, sticky header or marquee selection render with `DataGrid`
 * instead, and this is the one place that maps a column onto it: `name` becomes the header, a
 * column's own `onRender` its cell, `fieldName` the cell's text otherwise, `minWidth` and `maxWidth`
 * its sizing, and `isMultiline` whether the cell may wrap.
 *
 * @param columns The columns, in display order
 */
export function createDataGridColumns<TItem extends Record<string, any>>(
  columns: IListColumn<TItem>[]
): IDataGridColumns<TItem> {
  return {
    columns: columns.map((column) =>
      createTableColumn<TItem>({
        columnId: column.key,
        renderHeaderCell: () => column.name,
        renderCell: (item) => {
          const content = column.onRender
            ? column.onRender(item, undefined, column)
            : column.fieldName
              ? item[column.fieldName]
              : null
          return (
            <TableCellLayout truncate={!column.isMultiline} title={cellTitle(content)}>
              {content}
            </TableCellLayout>
          )
        }
      })
    ),
    columnSizingOptions: columns.reduce<TableColumnSizingOptions>(
      (options, column) => ({
        ...options,
        [column.key]: {
          minWidth: column.minWidth,
          defaultWidth: column.maxWidth ?? column.minWidth
        }
      }),
      {}
    )
  }
}

/**
 * The hover title for a cell: its text when the content is text, nothing when it is an element.
 */
function cellTitle(content: unknown): string | undefined {
  return typeof content === 'string' || typeof content === 'number' ? String(content) : undefined
}
