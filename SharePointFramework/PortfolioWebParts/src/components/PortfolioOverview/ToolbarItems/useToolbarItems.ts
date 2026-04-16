import strings from 'PortfolioWebPartsStrings'
import { ListMenuItem, ActiveFilters } from 'pp365-shared-library'
import React, { useMemo } from 'react'
import { IPortfolioOverviewContext } from '../context'
import { CLEAR_FILTERS, REMOVE_FILTER, TOGGLE_FILTER_PANEL } from '../reducer'
import { useExcelExport } from './useExcelExport'
import { usePortfolioSelector } from './usePortfolioSelector'
import { useViewSelector } from './useViewSelector'

/**
 * Returns an array of menu items for the toolbar in the PortfolioOverview component.
 *
 * @param context - The `IPortfolioOverviewContext` object containing the necessary data for generating the toolbar items.
 *
 * @returns An array of `IListMenuItem` objects representing the toolbar items.
 */
export function useToolbarItems(context: IPortfolioOverviewContext) {
  const exportToExcel = useExcelExport(context)
  const portfolioSelector = usePortfolioSelector(context)
  const viewSelector = useViewSelector(context)

  const activeFilterCount = useMemo(
    () =>
      Object.values(context.state.activeFilters ?? {}).reduce(
        (acc, curr) => acc + curr.length,
        0
      ),
    [context.state.activeFilters]
  )

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
          new ListMenuItem(null, strings.FilterText)
            .setIcon('Filter')
            .setBadge(activeFilterCount)
            .setOnClick(() => {
              context.dispatch(TOGGLE_FILTER_PANEL())
            }),
        context.props.showFilters &&
          activeFilterCount > 0 &&
          new ListMenuItem(null, strings.ClearFiltersText)
            .setIcon('FilterDismiss')
            .setOnClick(() => {
              context.dispatch(CLEAR_FILTERS())
            })
            .setPopoverContent(
              React.createElement(ActiveFilters, {
                filters: context.state.filters ?? [],
                onRemoveFilter: (fieldName: string, value: string) => {
                  context.dispatch(REMOVE_FILTER({ fieldName, value }))
                },
                onClearAll: () => context.dispatch(CLEAR_FILTERS()),
                compact: true
              })
            )
      ].filter(Boolean),
    [context.state, context.props, activeFilterCount]
  )
}
