import { createTableColumn, TableColumnDefinition } from '@fluentui/react-components'
import { useContext, useMemo } from 'react'
import { DynamicListContext } from './context'
import { renderItemColumn, useColumnRenderComponentRegistry } from 'pp365-shared-library'

export interface IListColumn extends TableColumnDefinition<any> {
  minWidth?: number
  defaultWidth?: number
}

export function useColumns(): IListColumn[] {
  const context = useContext(DynamicListContext)

  // Register column render components
  useColumnRenderComponentRegistry()

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
          // Use the column render system to render the cell value
          return renderItemColumn(item, column)
        }
      })
    })
  }, [context.state.data?.listColumns])
}
