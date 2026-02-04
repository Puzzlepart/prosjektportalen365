import { createTableColumn, TableColumnDefinition } from '@fluentui/react-components'
import { useContext, useMemo } from 'react'
import { DynamicListContext } from './context'
import { renderItemColumn, useColumnRenderComponentRegistry } from 'pp365-shared-library'

/**
 * Extended table column definition with width properties.
 *
 * Extends Fluent UI's TableColumnDefinition to include column sizing metadata
 * from ProjectContentColumns configuration.
 */
export interface IListColumn extends TableColumnDefinition<any> {
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
}

/**
 * Hook that transforms list column metadata into Fluent UI table column definitions.
 *
 * Registers column render components and maps SharePoint list columns to table columns
 * with proper sorting, rendering, and sizing configuration. Width values come from
 * ProjectContentColumns configuration enriched in fetchListData.
 *
 * Respects columnOrder from webpart properties if provided, otherwise uses the default order.
 *
 * Taxonomy field values are already transformed to semicolon-separated term names
 * by fetchListData, so no additional transformation is needed here.
 *
 * @returns Array of table column definitions with rendering and sizing metadata
 */
export function useColumns(): IListColumn[] {
  const context = useContext(DynamicListContext)
  useColumnRenderComponentRegistry()

  return useMemo(() => {
    if (!context.state.data?.listColumns) {
      return []
    }

    let columns = context.state.data.listColumns
    if (context.props.hiddenViewColumns && context.props.hiddenViewColumns.length > 0) {
      columns = columns.filter(
        (column) => !context.props.hiddenViewColumns.includes(column.fieldName || column.key)
      )
    }

    if (context.props.columnOrder && context.props.columnOrder.length > 0) {
      const orderMap = new Map<string, number>()
      context.props.columnOrder.forEach((columnName, index) => {
        orderMap.set(columnName, index)
      })

      columns = [...columns].sort((a, b) => {
        const aFieldName = a.fieldName || a.key
        const bFieldName = b.fieldName || b.key
        const aOrder = orderMap.get(aFieldName)
        const bOrder = orderMap.get(bFieldName)

        if (aOrder !== undefined && bOrder !== undefined) {
          return aOrder - bOrder
        }
        if (aOrder !== undefined) {
          return -1
        }
        if (bOrder !== undefined) {
          return 1
        }
        return 0
      })
    }

    return columns.map((column) => {
      const fieldName = column.fieldName || column.key

      return {
        ...createTableColumn<Record<string, any>>({
          columnId: column.key,
          compare: (a, b) => {
            const aVal = a[fieldName] || ''
            const bVal = b[fieldName] || ''
            return aVal.toString().localeCompare(bVal.toString())
          },
          renderHeaderCell: () => column.name,
          renderCell: (item) => renderItemColumn(item, column)
        }),
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
        defaultWidth: column.minWidth,
        data: column.data
      }
    })
  }, [context.state.data?.listColumns, context.props.hiddenViewColumns, context.props.columnOrder])
}
