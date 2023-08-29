import _ from 'lodash'
import { ExcelExportService } from 'pp365-shared-library/lib/services'
import { useCallback } from 'react'
import { IPortfolioOverviewContext } from './context'
import { EXCEL_EXPORT_ERROR, EXCEL_EXPORT_SUCCESS, START_EXCEL_EXPORT } from './reducer'

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
      const items =
        _.isArray(context.state.selectedItems) && context.state.selectedItems.length > 0
          ? context.state.selectedItems
          : context.items
      let fileNamePart: string
      if (context.props.includeViewNameInExcelExportFilename) {
        fileNamePart = context.state.currentView?.title.replace(/[^a-z0-9]/gi, '-')
      }
      ExcelExportService.export(items, context.state.columns, fileNamePart)
      context.dispatch(EXCEL_EXPORT_SUCCESS())
    } catch (error) {
      context.dispatch(EXCEL_EXPORT_ERROR(error))
    }
  }, [context.state])

  return { exportToExcel } as const
}
