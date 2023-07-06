import {
  CommandBar,
  ContextualMenuItemType,
  ICommandBarProps,
  IContextualMenuItem
} from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import React, { FC, useContext } from 'react'
import { isEmpty } from 'underscore'
import { PortfolioAggregationContext } from '../context'
import {
  SET_DATA_SOURCE,
  TOGGLE_COMPACT,
  TOGGLE_FILTER_PANEL,
  TOGGLE_VIEW_FORM_PANEL
} from '../reducer'

export const Commands: FC = () => {
  const context = useContext(PortfolioAggregationContext)

  const cmd: ICommandBarProps = {
    items: [],
    farItems: []
  }

  if (context.props.showExcelExportButton) {
    cmd.items.push({
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

  if (!isEmpty(context.state.dataSources)) {
    cmd.farItems.push(
      {
        key: 'VIEW_OPTIONS',
        name: context.state.dataSource,
        iconProps: { iconName: 'List' },
        buttonStyles: { root: { border: 'none' } },
        itemType: ContextualMenuItemType.Header,
        disabled: !context.props.showViewSelector || context.state.loading,
        data: { isVisible: context.props.showViewSelector },
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
            ...(context.state.dataSources.map((dataSource) => ({
              key: `DATA_SOURCE_${dataSource.id}`,
              name: dataSource.title,
              iconProps: { iconName: dataSource.iconName || 'DataConnectionLibrary' },
              canCheck: true,
              checked: dataSource.title === context.state.dataSource,
              onClick: () => context.dispatch(SET_DATA_SOURCE({ dataSource }))
            })) as IContextualMenuItem[]),
            {
              key: 'DIVIDER_02',
              itemType: ContextualMenuItemType.Divider
            },
            {
              key: 'NEW_VIEW',
              name: strings.NewViewText,
              onClick: () => {
                context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: true }))
              }
            },
            {
              key: 'EDIT_VIEW',
              name: strings.EditViewText,
              onClick: () => {
                context.dispatch(
                  TOGGLE_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView })
                )
              }
            }
          ].filter(Boolean)
        }
      } as IContextualMenuItem,
      {
        key: 'FILTERS',
        iconProps: { iconName: 'Filter' },
        buttonStyles: { root: { border: 'none' } },
        canCheck: true,
        checked: context.state.isFilterPanelOpen,
        disabled: !context.props.showFilters,
        data: { isVisible: context.props.showFilters },
        onClick: (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          context.dispatch(TOGGLE_FILTER_PANEL({ isOpen: true }))
        }
      } as IContextualMenuItem
    )
  }

  return (
    <div hidden={!context.props.showCommandBar}>
      <CommandBar {...cmd} />
    </div>
  )
}
