import { Toast, ToastBody, ToastTitle, useToastController } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import * as strings from 'ProjectWebPartsStrings'
import React, { useCallback, useContext } from 'react'
import { DynamicListContext } from '../context'
import { filterListItems } from '../useFilteredData'
import { getSelectedItems } from '../utils'

/**
 * The export button's text: how many selected rows it exports, when any are selected.
 *
 * @param selectedCount Number of selected rows
 */
export function getExportButtonText(selectedCount: number): string {
  if (selectedCount === 0) return strings.DynamicList.ExportToExcel
  return format(
    selectedCount === 1
      ? strings.DynamicList.ExportSelected
      : strings.DynamicList.ExportSelectedMultiple,
    selectedCount
  )
}

/**
 * Hook that provides functionality for exporting DynamicList data to Excel.
 *
 * Exports the selected rows, or else the rows the list shows (the search and the filters
 * applied), with the values as they are: the export service rounds and formats them. A failed
 * export is reported in a toast.
 *
 * @param toasterId Id of the toaster that reports a failed export
 *
 * @returns Callback function to trigger Excel export
 */
export function useExcelExport(toasterId: string) {
  const context = useContext(DynamicListContext)
  const { dispatchToast } = useToastController(toasterId)

  const exportToExcel = useCallback(() => {
    try {
      context.setState({ isExporting: true })
      const items =
        context.state.selectedItems?.length > 0
          ? getSelectedItems(context)
          : filterListItems(context.state)
      // The service is shared by every web part on the page, so it is configured as it runs.
      ExcelExportService.configure({
        name: context.props.title?.trim() || context.state.data?.listTitle || 'Export'
      })
      ExcelExportService.export(
        items,
        context.state.data?.listColumns || [],
        context.state.currentView?.title
      )
      context.setState({ isExporting: false })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      context.setState({ isExporting: false })
      dispatchToast(
        <Toast>
          <ToastTitle>{strings.DynamicList.ExportErrorTitle}</ToastTitle>
          <ToastBody>{strings.DynamicList.ExportErrorMessage}</ToastBody>
        </Toast>,
        { intent: 'error' }
      )
    }
  }, [context, dispatchToast])

  return exportToExcel
}
