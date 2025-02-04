/* eslint-disable no-console */
import _ from 'lodash'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { useCallback } from 'react'
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

      const items = !_.isEmpty(context.state.selectedItems)
        ? context.state.selectedItems
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
          const column = context.columns.find((c) => c.fieldName === key)
          switch (column?.dataType) {
            case 'percentage':
              filteredItem[key] = Math.floor(filteredItem[key] * 100) + '%'
              break
            case 'currency':
            case 'number':
              filteredItem[key] = Math.floor(filteredItem[key])
              break
            default:
              break
          }
        })
        return filteredItem
      })

      ExcelExportService.export(filteredItems, context.columns)
    } catch (error) {
      console.log(error)
    }
  }, [context.state, context.columns])

  return { exportToExcel }
}
