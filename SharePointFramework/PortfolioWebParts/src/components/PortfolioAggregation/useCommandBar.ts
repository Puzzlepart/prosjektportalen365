import { ContextualMenuItemType, ICommandBarProps, IContextualMenuItem } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { isEmpty } from 'underscore'
import { IPortfolioAggregationContext } from './context'
import {
  SET_DATA_SOURCE,
  SET_VIEW_FORM_PANEL,
  TOGGLE_COMPACT,
  TOGGLE_FILTER_PANEL
} from './reducer'

/**
 * Returns an object containing the items and farItems arrays for the command bar.
 *
 * @param context Context object for the Portfolio Aggregation component.
 *
 * @returns An object containing the items and farItems arrays for the command bar.
 */
export function useCommandBar(context: IPortfolioAggregationContext) {
  const items: IContextualMenuItem[] = []
  const farItems: IContextualMenuItem[] = []

  if (context.props.showExcelExportButton) {
    items.push({
      key: 'EXCEL_EXPORT',
      name: strings.ExcelExportButtonLabel,
      iconProps: {
        iconName: 'ExcelDocument',
        styles: { root: { color: 'green !important' } }
      },
      buttonStyles: { root: { border: 'none' } },
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
    })
  }

  if (!isEmpty(context.state.views)) {
    farItems.push(
      {
        key: 'VIEW_OPTIONS',
        name: context.state.currentView?.title,
        iconProps: { iconName: 'List' },
        buttonStyles: { root: { border: 'none' } },
        itemType: ContextualMenuItemType.Header,
        subMenuProps: {
          items: [
            {
              key: 'VIEW_LIST',
              name: strings.ListViewText,
              iconProps: { iconName: 'List' },
              canCheck: true,
              checked: !context.state.isCompact,
              onClick: () => context.dispatch(TOGGLE_COMPACT({ isCompact: false }))
            },
            {
              key: 'VIEW_COMPACT',
              name: strings.CompactViewText,
              iconProps: { iconName: 'AlignLeft' },
              canCheck: true,
              checked: context.state.isCompact,
              onClick: () => context.dispatch(TOGGLE_COMPACT({ isCompact: true }))
            },
            {
              key: 'DIVIDER_01',
              itemType: ContextualMenuItemType.Divider
            },
            ...(context.state.views.map((dataSource) => ({
              key: `DATA_SOURCE_${dataSource.id}`,
              name: dataSource.title,
              iconProps: { iconName: dataSource.iconName ?? 'DataConnectionLibrary' },
              canCheck: true,
              checked: dataSource.title === context.state.currentView?.title,
              onClick: () => context.dispatch(SET_DATA_SOURCE({ dataSource }))
            })) as IContextualMenuItem[]),
            {
              key: 'DIVIDER_02',
              itemType: ContextualMenuItemType.Divider
            },
            {
              key: 'NEW_VIEW',
              name: strings.NewViewText,
              disabled: context.props.isParentProject,
              onClick: () => {
                context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: true }))
              }
            },
            {
              key: 'EDIT_VIEW',
              name: strings.EditViewText,
              disabled: context.props.isParentProject,
              onClick: () => {
                context.dispatch(
                  SET_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView })
                )
              }
            }
          ]
        }
      },
      {
        key: 'FILTERS',
        iconProps: { iconName: 'Filter' },
        buttonStyles: { root: { border: 'none' } },
        canCheck: true,
        checked: context.state.isFilterPanelOpen,
        disabled: !context.props.showFilters,
        onClick: (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          context.dispatch(TOGGLE_FILTER_PANEL({ isOpen: true }))
        }
      }
    )
  }

  const commandBarProps: ICommandBarProps = {
    items: []
  }

  commandBarProps.items = items.map((item) => ({
    ...item,
    disabled: item.disabled || context.state.loading
  }))
  commandBarProps.farItems = farItems.map((item) => ({
    ...item,
    disabled: item.disabled || context.state.loading
  }))

  return commandBarProps
}
