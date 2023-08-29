import { IContextualMenuItem } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { ExcelExportService } from 'pp365-shared-library/lib/services'
import { useCallback, useContext } from 'react'
import { PortfolioOverviewContext } from './context'
import {
  EXCEL_EXPORT_ERROR,
  EXCEL_EXPORT_SUCCESS,
  START_EXCEL_EXPORT
} from './reducer'

export function useExcelExport() {
  const context = useContext(PortfolioOverviewContext)

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

  const exportToExcelContextualMenuItem: IContextualMenuItem = {
    key: 'EXCEL_EXPORT',
    name: strings.ExcelExportButtonLabel,
    iconProps: {
      iconName: 'ExcelDocument',
      styles: { root: { color: 'green !important' } }
    },
    buttonStyles: { root: { border: 'none' } },
    data: { isVisible: context.props.showExcelExportButton },
    disabled: context.state.isExporting || context.state.loading,
    onClick: () => {
      exportToExcel()
    }
  }

  return { exportToExcelContextualMenuItem } as const
}
