import {
  AppsListRegular,
  ContentView24Filled,
  ContentView24Regular,
  Filter24Filled,
  Filter24Regular,
  TextBulletListLtrRegular,
  bundleIcon
} from '@fluentui/react-icons'
import * as strings from 'PortfolioWebPartsStrings'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { useMemo } from 'react'
import { ListMenuItem, ListMenuItemDivider } from '../../List'
import { IPortfolioAggregationContext } from '../context'
import {
  SET_DATA_SOURCE,
  SET_VIEW_FORM_PANEL,
  TOGGLE_COMPACT,
  TOGGLE_FILTER_PANEL
} from '../reducer'

/**
 * Object containing icons used in the toolbar.
 */
const Icons = {
  ContentView: bundleIcon(ContentView24Filled, ContentView24Regular),
  Filter: bundleIcon(Filter24Filled, Filter24Regular)
}

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

  const menuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        context.props.showExcelExportButton &&
        new ListMenuItem().setIcon('ExcelLogoInverse').setOnClick(() => {
          ExcelExportService.configure({ name: context.props.title })
          ExcelExportService.export(context.state.items, [
            {
              key: 'SiteTitle',
              fieldName: 'SiteTitle',
              name: strings.SiteTitleLabel,
              minWidth: null
            },
            ...(context.state.columns as any[])
          ])
        }).setStyle({ color: '#008000' }),
        new ListMenuItem(context.state.currentView?.title)
          .setIcon(Icons.ContentView)
          .setWidth(220)
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
              new ListMenuItem(strings.NewViewText)
                .setDisabled(context.props.isParentProject)
                .setOnClick(() => {
                  context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: true }))
                }),
              new ListMenuItem(strings.EditViewText)
                .setDisabled(context.props.isParentProject)
                .setOnClick(() => {
                  context.dispatch(
                    SET_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView })
                  )
                })
            ],
            checkedValues
          ),
        new ListMenuItem().setIcon(Icons.Filter).setOnClick(() => {
          context.dispatch(TOGGLE_FILTER_PANEL())
        })
      ].filter(Boolean),
    [context.state, context.props]
  )

  return menuItems
}
