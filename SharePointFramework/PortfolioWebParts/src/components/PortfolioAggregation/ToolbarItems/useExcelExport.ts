import { useCallback } from 'react'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { IPortfolioAggregationContext } from '../context'

/**
 * Hook that provides functionality for exporting data to Excel.
 *
 * @param context - The context object that contains the state and dispatch functions.
 *
 * @returns An object containing a contextual menu item for Excel export.
 */
export function useExcelExport(context: IPortfolioAggregationContext) {
  ExcelExportService.configure({ name: context.props.title })

  /**
   * Callback function for Excel export. Handles the export to Excel with state updates and
   * error handling.
   */
  const exportToExcel = useCallback(() => {
    try {
      if (!ExcelExportService.isConfigured) {
        return
      }
      const { selectedItems, columns } = context.state

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
      ExcelExportService.export(items, columns)
    } catch (error) {}
  }, [context.state])

  return { exportToExcel }
}
