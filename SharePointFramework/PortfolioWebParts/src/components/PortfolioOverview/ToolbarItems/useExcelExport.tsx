import { Toast, ToastBody, ToastTitle, useToastController } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import React, { useCallback } from 'react'
import { IPortfolioOverviewContext } from '../context'
import { filterItems } from '../hooks/useFilteredData'
import { EXCEL_EXPORT_ERROR, EXCEL_EXPORT_SUCCESS, START_EXCEL_EXPORT } from '../reducer'

/**
 * Hook that provides functionality for exporting data to Excel.
 *
 * Exports the selected rows, or else the rows the list shows (the search and the filters
 * applied), with the values as they are: the export service rounds and formats them. A failed
 * export is reported in a toast.
 *
 * @param context - The context object that contains the state and dispatch functions.
 *
 * @returns The callback that runs the export.
 */
export function useExcelExport(context: IPortfolioOverviewContext) {
  const { dispatchToast } = useToastController(context.toasterId)

  const exportToExcel = useCallback(() => {
    context.dispatch(START_EXCEL_EXPORT())
    try {
      const { selectedItems, columns, currentView } = context.state
      const items = selectedItems?.length > 0 ? selectedItems : filterItems(context)
      const fileNamePart = context.props.includeViewNameInExcelExportFilename
        ? currentView?.title
        : undefined
      // The service is shared by every web part on the page, so it is configured as it runs.
      ExcelExportService.configure({ name: context.props.title })
      ExcelExportService.export(items, columns, fileNamePart)
      context.dispatch(EXCEL_EXPORT_SUCCESS())
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      context.dispatch(EXCEL_EXPORT_ERROR(error))
      dispatchToast(
        <Toast>
          <ToastTitle>{strings.ExcelExportErrorTitle}</ToastTitle>
          <ToastBody>{strings.ExcelExportErrorMessage}</ToastBody>
        </Toast>,
        { intent: 'error' }
      )
    }
  }, [context.state, context.props, dispatchToast])

  return exportToExcel
}
