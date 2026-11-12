import strings from 'PortfolioWebPartsStrings'
import { ListMenuItem } from 'pp365-shared-library'
import { useMemo } from 'react'
import { IPortfolioOverviewContext } from '../context'
import { TOGGLE_FILTER_PANEL } from '../reducer'
import { useExcelExport } from './useExcelExport'
import { usePortfolioSelector } from './usePortfolioSelector'
import { useViewSelector } from './useViewSelector'

/**
 * Build overview export, portfolio, view and filter commands.
 */
export function useToolbarItems(context: IPortfolioOverviewContext) {
  const exportToExcel = useExcelExport(context)
  const portfolioSelector = usePortfolioSelector(context)
  const viewSelector = useViewSelector(context)

  return useMemo<ListMenuItem[]>(
    () =>
      [
        context.props.showExcelExportButton &&
          new ListMenuItem(null, strings.ExcelExportButtonLabel)
            .setIcon('ExcelLogoInverse')
            .setOnClick(exportToExcel)
            .setStyle({
              color: '#10793F'
            }),
        portfolioSelector,
        viewSelector,
        context.props.showFilters &&
          new ListMenuItem(null, strings.FilterText).setIcon('Filter').setOnClick(() => {
            context.dispatch(TOGGLE_FILTER_PANEL())
          })
      ].filter(Boolean),
    [context.state, context.props]
  )
}
