import { Toast, ToastBody, ToastTitle, useToastController } from '@fluentui/react-components'
import _ from 'lodash'
import strings from 'PortfolioWebPartsStrings'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import React, { useCallback } from 'react'
import { IPortfolioAggregationContext } from '../context'
import { getFilteredItems } from '../usePortfolioAggregationFilteredItems'

/**
 * The name of the category's column with `internalName`, which names a column of the
 * measurements sheet.
 */
function getColumnName(context: IPortfolioAggregationContext, internalName: string) {
  return context.state.allColumnsForCategory?.find((col) => col.internalName === internalName)?.name
}

/**
 * Hook that provides functionality for exporting data to Excel.
 *
 * Exports the selected rows, or else the rows the list shows (filtered and searched as the list
 * does), with trend values as their achievement and the other values as they are: the export
 * service rounds and formats them. A failed export is reported in a toast.
 *
 * @param context - The context object that contains the state and dispatch functions.
 *
 * @returns An object holding the callback that runs the export.
 */
export function useExcelExport(context: IPortfolioAggregationContext) {
  const { dispatchToast } = useToastController(context.toasterId)

  const exportToExcel = useCallback(() => {
    try {
      const items = !_.isEmpty(context.state.selectedItems)
        ? context.state.selectedItems
        : getFilteredItems(context.state)

      const exportedItems = items.map((item) => {
        const exportedItem = { ...item }
        context.state.columns
          .filter((column) => column.dataType === 'trend' && column.fieldName in exportedItem)
          .forEach(({ fieldName }) => {
            const json = exportedItem[fieldName]?.trim()
            if (!json || json === '{}') {
              exportedItem[fieldName] = ''
            } else {
              const achievement = Number(JSON.parse(json)?.Achievement)
              exportedItem[fieldName] = isNaN(achievement) ? 0 : achievement
            }
          })
        return exportedItem
      })

      // The service is shared by every web part on the page, so it is configured as it runs.
      ExcelExportService.configure({
        name: context.props.title,
        measurementsSheetConfiguration: context.state.allColumnsForCategory
          ? {
              renameKeys: {
                Title: { name: strings.MeasurementSheetTitleKey },
                Value: { name: getColumnName(context, 'GtMeasurementValue') },
                Comment: { name: getColumnName(context, 'GtMeasurementComment') },
                Achievement: { name: getColumnName(context, 'MeasurementAchievement') },
                Date: { name: getColumnName(context, 'GtMeasurementDate'), dataType: 'date' }
              },
              titleKey: getColumnName(context, 'Title')
            }
          : undefined
      })
      ExcelExportService.export(exportedItems, context.state.columns)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      dispatchToast(
        <Toast>
          <ToastTitle>{strings.ExcelExportErrorTitle}</ToastTitle>
          <ToastBody>{strings.ExcelExportErrorMessage}</ToastBody>
        </Toast>,
        { intent: 'error' }
      )
    }
  }, [context.state, context.props, dispatchToast])

  return { exportToExcel }
}
