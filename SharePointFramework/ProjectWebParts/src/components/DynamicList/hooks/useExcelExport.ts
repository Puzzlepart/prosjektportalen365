import { useCallback, useContext } from 'react'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { DynamicListContext } from '../context'

/**
 * Hook that provides functionality for exporting DynamicList data to Excel.
 *
 * Exports either selected items or all filtered items based on selection state.
 * Handles active filters and applies appropriate data transformations.
 *
 * @returns Callback function to trigger Excel export
 */
export function useExcelExport() {
  const context = useContext(DynamicListContext)

  /**
   * Callback function for Excel export. Handles the export to Excel with state updates and
   * error handling.
   */
  const exportToExcel = useCallback(() => {
    try {
      context.setState({ isExporting: true })

      if (!ExcelExportService.isConfigured) {
        ExcelExportService.configure({ name: context.props.title || 'Export' })
      }

      const { selectedItems, data } = context.state
      const columns = data?.listColumns || []

      const items =
        selectedItems?.length > 0
          ? selectedItems.map((idx) => data.listItems[idx])
          : data.listItems.filter((item) => {
              if (Object.keys(context.state.activeFilters).length === 0) {
                return true
              }
              return Object.keys(context.state.activeFilters).every((key) => {
                const filterValues = context.state.activeFilters[key]
                return filterValues.some((filterValue) => {
                  return item[key] === filterValue || item[key]?.includes(filterValue)
                })
              })
            })

      const filteredItems = items.map((item) => {
        const filteredItem = { ...item }
        Object.keys(filteredItem).forEach((key) => {
          const column = columns.find((c) => c.fieldName === key)
          if (column) {
            switch ((column as any).dataType) {
              case 'currency':
              case 'number':
                filteredItem[key] = Math.floor(filteredItem[key])
                break
              case 'percentage':
                filteredItem[key] = Math.floor(filteredItem[key] * 100) + '%'
                break
              default:
                break
            }
          }
        })
        return filteredItem
      })

      let fileNamePart: string
      if (context.state.currentView?.title) {
        fileNamePart = context.state.currentView.title.replace(/[^a-z0-9]/gi, '-')
      }

      ExcelExportService.export(filteredItems, columns, fileNamePart)
      context.setState({ isExporting: false })
    } catch (error) {
      console.error('Excel export error:', error)
      context.setState({ isExporting: false })
    }
  }, [context])

  return exportToExcel
}
