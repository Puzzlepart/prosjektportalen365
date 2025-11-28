import { createTableColumn, TableColumnDefinition } from '@fluentui/react-components'
import { useContext, useMemo } from 'react'
import { DynamicListContext } from './context'

export interface IListColumn extends TableColumnDefinition<any> {
  minWidth?: number
  defaultWidth?: number
}

export function useColumns(): IListColumn[] {
  const context = useContext(DynamicListContext)

  return useMemo(() => {
    if (!context.state.data?.listColumns) {
      return []
    }

    return context.state.data.listColumns.map((column) => {
      const fieldName = column.fieldName || column.key

      return createTableColumn<Record<string, any>>({
        columnId: column.key,
        compare: (a, b) => {
          const aVal = a[fieldName] || ''
          const bVal = b[fieldName] || ''
          return aVal.toString().localeCompare(bVal.toString())
        },
        renderHeaderCell: () => column.name,
        renderCell: (item) => {
          const value = item[fieldName]

          // Handle different field types
          if (value === null || value === undefined) {
            return '-'
          }

          // Handle dates
          if (value instanceof Date) {
            return value.toLocaleDateString()
          }

          // Handle booleans
          if (typeof value === 'boolean') {
            return value ? 'Ja' : 'Nei'
          }

          return value.toString()
        }
      })
    })
  }, [context.state.data?.listColumns])
}
