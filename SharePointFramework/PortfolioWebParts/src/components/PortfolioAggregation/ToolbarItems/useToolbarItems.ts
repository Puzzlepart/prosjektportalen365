import { AppsListRegular, TextBulletListLtrRegular } from '@fluentui/react-icons'
import * as strings from 'PortfolioWebPartsStrings'
import { ListMenuItem, ListMenuItemDivider, ActiveFilters } from 'pp365-shared-library'
import React, { useMemo } from 'react'
import { IPortfolioAggregationContext } from '../context'
import {
  CLEAR_FILTERS,
  REMOVE_FILTER,
  SET_DATA_SOURCE,
  SET_VIEW_FORM_PANEL,
  TOGGLE_COMPACT,
  TOGGLE_FILTER_PANEL
} from '../reducer'
import { useExcelExport } from './useExcelExport'
import { Icons } from './icons'
import resource from 'SharedResources'

/**
 * Returns an array of toolbar items for the PortfolioAggregation component.
 *
 * @param context - The IPortfolioAggregationContext object containing the current state and props of the component.
 *
 * @returns An array of IListMenuItem objects representing the toolbar items.
 */
export function useToolbarItems(context: IPortfolioAggregationContext) {
  const checkedValues = useMemo(
    () => ({
      views: [context.state.currentView?.id.toString()],
      renderMode: context.state.isCompact ? ['compactList'] : ['list']
    }),
    [context.state.currentView?.id, context.state.isCompact]
  )
  const { exportToExcel } = useExcelExport(context)

  const views = context.state.views.map<ListMenuItem>((dataSource) =>
    new ListMenuItem(dataSource.title)
      .setIcon(dataSource.iconName)
      .makeCheckable({
        name: 'views',
        value: dataSource.id.toString()
      })
      .setOnClick(() => {
        context.dispatch(SET_DATA_SOURCE({ dataSource }))
      })
  )

  const activeFilterCount = useMemo(
    () =>
      Object.values(context.state.activeFilters ?? {}).reduce(
        (acc, curr) => acc + curr.length,
        0
      ),
    [context.state.activeFilters]
  )

  const menuItems = useMemo<ListMenuItem[]>(
    () => [
      new ListMenuItem(null, strings.ExcelExportButtonLabel)
        .setIcon('ExcelLogoInverse')
        .setOnClick(exportToExcel)
        .setDisabled(context.state.isChangingView)
        .setStyle({ color: '#10793F' })
        .setHidden(!context.props.showExcelExportButton),
      new ListMenuItem(context.state.currentView?.title, resource.Lists_PortfolioViews_Title)
        .setIcon(Icons.ContentView)
        .setWidth('fit-content')
        .setStyle({ minWidth: '145px' })
        .setDisabled(context.state.isChangingView)
        .setHidden(!context.props.showViewSelector)
        .setItems(
          [
            new ListMenuItem(strings.ListViewText)
              .setIcon(AppsListRegular)
              .makeCheckable({
                name: 'renderMode',
                value: 'list'
              })
              .setOnClick(() => {
                context.dispatch(TOGGLE_COMPACT())
              }),
            new ListMenuItem(strings.CompactViewText)
              .setIcon(TextBulletListLtrRegular)
              .makeCheckable({
                name: 'renderMode',
                value: 'compactList'
              })
              .setOnClick(() => {
                context.dispatch(TOGGLE_COMPACT())
              }),
            ListMenuItemDivider,
            ...views,
            ListMenuItemDivider,
            new ListMenuItem(strings.NewViewText).setIcon(Icons.FormNew).setOnClick(() => {
              context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: true }))
            }),
            new ListMenuItem(strings.EditViewText).setIcon(Icons.Edit).setOnClick(() => {
              context.dispatch(
                SET_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView })
              )
            })
          ],
          checkedValues
        ),
      new ListMenuItem(null, strings.FilterText)
        .setIcon('Filter')
        .setBadge(activeFilterCount)
        .setOnClick(() => {
          context.dispatch(TOGGLE_FILTER_PANEL())
        })
        .setDisabled(context.state.isChangingView)
        .setHidden(!context.props.showFilters),
      activeFilterCount > 0 &&
        context.props.showFilters &&
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
    ],
    [context.state, context.props, activeFilterCount]
  )

  return menuItems
}
