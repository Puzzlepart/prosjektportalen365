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
import { IListMenuItem } from '../../List'
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

export function useToolbarItems(context: IPortfolioAggregationContext) {
  const checkedValues = useMemo(
    () => ({
      views: [context.state.currentView?.id.toString()],
      renderMode: context.state.isCompact ? ['compactList'] : ['list']
    }),
    [context.state.currentView?.id, context.state.isCompact]
  )

  const views = context.state.views.map<IListMenuItem>((d) => ({
    text: d.title,
    name: 'views',
    value: d.id.toString(),
    icon: d.iconName,
    onClick: () => {
      context.dispatch(SET_DATA_SOURCE({ dataSource: d }))
    }
  }))

  const menuItems = useMemo<IListMenuItem[]>(
    () =>
      [
        context.props.showExcelExportButton &&
          ({
            icon: 'ExcelLogoInverse',
            onClick: () => {
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
            }
          } as IListMenuItem),
        {
          icon: Icons.ContentView,
          text: context.state.currentView?.title,
          width: 220,
          checkedValues,
          items: [
            {
              text: strings.ListViewText,
              icon: AppsListRegular,
              name: 'renderMode',
              value: 'list',
              onClick: () => {
                context.dispatch(TOGGLE_COMPACT())
              }
            } as IListMenuItem,
            {
              text: strings.CompactViewText,
              icon: TextBulletListLtrRegular,
              name: 'renderMode',
              value: 'compactList',
              onClick: () => {
                context.dispatch(TOGGLE_COMPACT())
              }
            } as IListMenuItem,
            {
              type: 'divider'
            } as IListMenuItem,
            ...views,
            {
              type: 'divider'
            } as IListMenuItem,
            {
              text: strings.NewViewText,
              disabled: context.props.isParentProject,
              onClick: () => {
                context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: true }))
              }
            } as IListMenuItem,
            {
              text: strings.EditViewText,
              disabled: context.props.isParentProject,
              onClick: () => {
                context.dispatch(
                  SET_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView })
                )
              }
            } as IListMenuItem
          ]
        } as IListMenuItem,
        {
          icon: Icons.Filter,
          onClick: () => {
            context.dispatch(TOGGLE_FILTER_PANEL())
          }
        } as IListMenuItem
      ].filter(Boolean),
    [context.state, context.props]
  )

  return menuItems
}
