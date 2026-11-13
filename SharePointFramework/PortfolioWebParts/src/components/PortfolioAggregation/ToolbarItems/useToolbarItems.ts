import { AppsListRegular, TextBulletListLtrRegular } from '@fluentui/react-icons'
import * as strings from 'PortfolioWebPartsStrings'
import { ListMenuItem, ListMenuItemDivider, format } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { useMemo } from 'react'
import { IPortfolioAggregationContext } from '../context'
import {
  SET_DATA_SOURCE,
  SET_VIEW_FORM_PANEL,
  TOGGLE_COMPACT,
  TOGGLE_FILTER_PANEL
} from '../reducer'
import { useExcelExport } from './useExcelExport'
import { Icons } from './icons'
import resource from 'SharedResources'

/**
 * Build export, view, layout, view-editing and filter commands for the aggregation. A data source
 * and a list layout picked from the view selector are counted for usage statistics, for the web
 * part the overview is in, unless the pick is what the overview shows already.
 */
export function useToolbarItems(context: IPortfolioAggregationContext) {
  const telemetry = useTelemetry()
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
        const isSwitch = context.state.currentView?.id !== dataSource.id
        context.dispatch(SET_DATA_SOURCE({ dataSource }))
        if (isSwitch) telemetry.track('dataSource.switched')
      })
  )

  /** Shows the list in the layout picked, and counts the pick when it changes the layout. */
  const setCompact = (isCompact: boolean) => {
    const isToggle = !!context.state.isCompact !== isCompact
    context.dispatch(TOGGLE_COMPACT(isCompact))
    if (isToggle) telemetry.track('layout.toggled')
  }

  const menuItems = useMemo<ListMenuItem[]>(
    () => [
      new ListMenuItem(null, strings.ExcelExportButtonLabel)
        .setIcon('ExcelLogoInverse')
        .setOnClick(exportToExcel)
        .setDisabled(context.state.isChangingView || context.state.loading)
        .setStyle({ color: '#10793F' })
        .setHidden(!context.props.showExcelExportButton),
      new ListMenuItem(context.state.currentView?.title, resource.Lists_PortfolioViews_Title)
        // Named by what it chooses too, not only by the view it shows (WCAG 2.4.6).
        .setAriaLabel(
          format(
            strings.SelectorButtonLabel,
            context.state.currentView?.title,
            resource.Lists_PortfolioViews_Title
          )
        )
        .setIcon(Icons.ContentView)
        .makeShrinkable()
        .setDisabled(context.state.isChangingView || context.state.loading)
        .setHidden(!context.props.showViewSelector)
        .setItems(
          [
            new ListMenuItem(strings.ListViewText)
              .setIcon(AppsListRegular)
              .makeCheckable({
                name: 'renderMode',
                value: 'list'
              })
              .setOnClick(() => setCompact(false)),
            new ListMenuItem(strings.CompactViewText)
              .setIcon(TextBulletListLtrRegular)
              .makeCheckable({
                name: 'renderMode',
                value: 'compactList'
              })
              .setOnClick(() => setCompact(true)),
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
        .setOnClick(() => {
          context.dispatch(TOGGLE_FILTER_PANEL())
        })
        .setDisabled(context.state.isChangingView || context.state.loading)
        .setHidden(!context.props.showFilters)
    ],
    [context.state, context.props]
  )

  return menuItems
}
