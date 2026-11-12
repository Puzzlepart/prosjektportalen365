import {
  TableCellLayout,
  TableColumnSizingOptions,
  createTableColumn
} from '@fluentui/react-components'
import React from 'react'
import { IDataGridColumn } from '../components/DataGridList/types'
import { IListColumn } from '../types'

/**
 * Pairs grid column definitions with their sizing options.
 */
export interface IDataGridColumns<TItem> {
  /**
   * Column definitions for `DataGrid`, carrying their widths for `DataGridList` to size them by.
   */
  columns: IDataGridColumn<TItem>[]

  /**
   * Sizing options for `DataGrid`, keyed by column, from each column's `minWidth` and `maxWidth`.
   */
  columnSizingOptions: TableColumnSizingOptions
}

/**
 * Maps list columns to grid headers, cell renderers and sizing options.
 * A column's maxWidth supplies its starting width, not an upper resizing limit.
 */
export function createDataGridColumns<TItem extends Record<string, any>>(
  columns: IListColumn<TItem>[]
): IDataGridColumns<TItem> {
  return {
    columns: columns.map((column) => ({
      ...createTableColumn<TItem>({
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
      }),
      minWidth: column.minWidth,
      defaultWidth: column.maxWidth ?? column.minWidth
    })),
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
