import { createTableColumn, TableColumnDefinition } from '@fluentui/react-components'
import { useContext, useMemo } from 'react'
import { DynamicListContext } from './context'
import { renderItemColumn, useColumnRenderComponentRegistry } from 'pp365-shared-library'

/** Table column definition enriched with hub-configured width limits. */
export interface IListColumn extends TableColumnDefinition<any> {
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
}

/** Builds sortable typed columns using hub sizing, hidden-field settings and configured column order. */
export function useColumns(): IListColumn[] {
  const context = useContext(DynamicListContext)
  useColumnRenderComponentRegistry()

  return useMemo(() => {
    if (!context.state.data?.listColumns) {
      return []
    }

    let columns = context.state.data.listColumns
    const manualHiddenColumns = context.props.hiddenViewColumns || []
    const autoHiddenColumns = context.state.data.autoHiddenViewColumns || []
    const effectiveHiddenColumns = new Set([...manualHiddenColumns, ...autoHiddenColumns])

    if (effectiveHiddenColumns.size > 0) {
      columns = columns.filter(
        (column) => !effectiveHiddenColumns.has((column.fieldName || column.key) as string)
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
  }, [
    context.state.data?.listColumns,
    context.state.data?.autoHiddenViewColumns,
    context.props.hiddenViewColumns,
    context.props.columnOrder
  ])
}
