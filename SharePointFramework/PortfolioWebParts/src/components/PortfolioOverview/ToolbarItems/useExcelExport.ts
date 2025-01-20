import { useCallback } from 'react'
import { IPortfolioOverviewContext } from '../context'
import { EXCEL_EXPORT_ERROR, EXCEL_EXPORT_SUCCESS, START_EXCEL_EXPORT } from '../reducer'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'

/**
 * Hook that provides functionality for exporting data to Excel.
 *
 * @param context - The context object that contains the state and dispatch functions.
 *
 * @returns An object containing a contextual menu item for Excel export.
 */
export function useExcelExport(context: IPortfolioOverviewContext) {
  /**
   * Callback function for Excel export. Handles the export to Excel with state updates and
   * error handling.
   */
  const exportToExcel = useCallback(() => {
    context.dispatch(START_EXCEL_EXPORT())
    try {
      if (!ExcelExportService.isConfigured) {
        context.dispatch(EXCEL_EXPORT_ERROR(new Error('ExcelExportService is not configured')))
      }
      const { selectedItems, columns, currentView } = context.state
      const { includeViewNameInExcelExportFilename } = context.props
      const items =
        selectedItems?.length > 0
          ? selectedItems
          : context.state.items.filter((item) => {
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
          if (column && (column.dataType === 'currency' || column.dataType === 'number')) {
            filteredItem[key] = Math.floor(filteredItem[key])
          }
        })
        return filteredItem
      })

      let fileNamePart: string
      if (includeViewNameInExcelExportFilename) {
        fileNamePart = currentView?.title.replace(/[^a-z0-9]/gi, '-')
      }
      ExcelExportService.export(filteredItems, columns, fileNamePart)
      context.dispatch(EXCEL_EXPORT_SUCCESS())
    } catch (error) {
      context.dispatch(EXCEL_EXPORT_ERROR(error))
    }
  }, [context.state])

  return exportToExcel
}
