import _ from 'lodash'
import strings from 'PortfolioWebPartsStrings'
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
  const measurementsSheetConfiguration = context.state.allColumnsForCategory
    ? {
        renameKeys: {
          Title: { name: strings.MeasurementSheetTitleKey },
          Value: {
            name: context.state.allColumnsForCategory?.find(
              (col) => col.internalName === 'GtMeasurementValue'
            )?.name
          },
          Comment: {
            name: context.state.allColumnsForCategory?.find(
              (col) => col.internalName === 'GtMeasurementComment'
            )?.name
          },
          Achievement: {
            name: context.state.allColumnsForCategory?.find(
              (col) => col.internalName === 'MeasurementAchievement'
            )?.name
          },
          DateDisplay: {
            name: context.state.allColumnsForCategory?.find(
              (col) => col.internalName === 'GtMeasurementDate'
            )?.name,
            dataType: 'date'
          }
        },
        titleKey: context.state.allColumnsForCategory.find((col) => col.internalName === 'Title')
          ?.name
      }
    : undefined

  ExcelExportService.configure({
    name: context.props.title,
    measurementsSheetConfiguration
  })

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
          const column = context.state.columns.find((c) => c.fieldName === key)
          switch (column?.dataType) {
            case 'percentage':
              filteredItem[key] = Math.floor(filteredItem[key] * 100) + '%'
              break
            case 'currency':
            case 'number':
              filteredItem[key] = Math.floor(filteredItem[key])
              break
            case 'trend':
              const json = filteredItem[key]?.trim()
              if (!json || json === '{}') {
                filteredItem[key] = ''
              } else {
                const parsed = JSON.parse(json)
                const achievement = Number(parsed?.Achievement)
                filteredItem[key] = Math.floor(isNaN(achievement) ? 0 : achievement * 100) / 100
              }
              break
            default:
              break
          }
        })
        return filteredItem
      })

      ExcelExportService.export(filteredItems, context.state.columns)
    } catch (error) {
      console.error(error)
    }
  }, [context.state, context.state.columns])
  return { exportToExcel }
}
