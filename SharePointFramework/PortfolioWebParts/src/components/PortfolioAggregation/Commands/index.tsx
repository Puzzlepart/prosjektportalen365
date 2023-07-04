import {
  ICommandBarProps,
  IContextualMenuItem,
  ContextualMenuItemType,
  CommandBar
} from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { redirect } from 'pp365-shared-library/lib/util'
import React, { FC, useContext } from 'react'
import { isEmpty } from 'underscore'
import { PortfolioAggregationContext } from '../context'
import { SET_DATA_SOURCE, TOGGLE_COMPACT, TOGGLE_FILTER_PANEL } from '../reducer'

export const Commands: FC = () => {
  const { props, state, dispatch } = useContext(PortfolioAggregationContext)

  const cmd: ICommandBarProps = {
    items: [],
    farItems: []
  }

  if (props.showExcelExportButton) {
    cmd.items.push({
      key: 'ExcelExport',
      name: strings.ExcelExportButtonLabel,
      iconProps: {
        iconName: 'ExcelDocument',
        styles: { root: { color: 'green !important' } }
      },
      buttonStyles: { root: { border: 'none' } },
      onClick: () => {
        ExcelExportService.configure({ name: props.title })
        ExcelExportService.export(state.items, [
          {
            key: 'SiteTitle',
            fieldName: 'SiteTitle',
            name: strings.SiteTitleLabel,
            minWidth: null
          },
          ...(state.columns as any[])
        ])
      }
    })
  }

  if (!isEmpty(state.dataSources)) {
    cmd.farItems.push(
      {
        key: 'NewView',
        name: strings.NewViewText,
        iconProps: { iconName: 'CirclePlus' },
        buttonStyles: { root: { border: 'none' } },
        disabled: !props.showViewSelector,
        data: {
          isVisible: props.pageContext.legacyPageContext.isSiteAdmin && props.showViewSelector
        },
        onClick: () => redirect(props.configuration.viewsUrls.defaultNewFormUrl)
      } as IContextualMenuItem,
      {
        key: 'ViewOptions',
        name: state.dataSource,
        iconProps: { iconName: 'List' },
        buttonStyles: { root: { border: 'none' } },
        itemType: ContextualMenuItemType.Header,
        disabled: !props.showViewSelector,
        data: { isVisible: props.showViewSelector },
        subMenuProps: {
          items: [
            {
              key: 'ViewList',
              name: 'Liste',
              iconProps: { iconName: 'List' },
              canCheck: true,
              checked: !state.isCompact,
              onClick: () => dispatch(TOGGLE_COMPACT({ isCompact: false }))
            },
            {
              key: 'ViewCompact',
              name: 'Kompakt liste',
              iconProps: { iconName: 'AlignLeft' },
              canCheck: true,
              checked: state.isCompact,
              onClick: () => dispatch(TOGGLE_COMPACT({ isCompact: true }))
            },
            {
              key: 'Divider01',
              itemType: ContextualMenuItemType.Divider
            },
            ...(state.dataSources.map((ds) => ({
              key: `DataSources_${ds.id}`,
              name: ds.title,
              iconProps: { iconName: ds.iconName || 'DataConnectionLibrary' },
              canCheck: true,
              checked: ds.title === state.dataSource,
              onClick: () => dispatch(SET_DATA_SOURCE({ dataSource: ds }))
            })) as IContextualMenuItem[]),
            {
              key: 'Divider02',
              itemType: ContextualMenuItemType.Divider
            },
            {
              key: 'EditView',
              name: strings.EditViewText,
              onClick: () =>
                redirect(
                  `${props.configuration.viewsUrls.defaultEditFormUrl}?ID=${state.currentView.id}`
                )
            }
          ]
        }
      } as IContextualMenuItem,
      {
        key: 'Filters',
        name: '',
        iconProps: { iconName: 'Filter' },
        buttonStyles: { root: { border: 'none' } },
        itemType: ContextualMenuItemType.Normal,
        canCheck: true,
        checked: state.showFilterPanel,
        disabled: !props.showFilters,
        data: { isVisible: props.showFilters },
        onClick: (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          dispatch(TOGGLE_FILTER_PANEL({ isOpen: true }))
        }
      } as IContextualMenuItem
    )
  }

  return (
    <div hidden={!props.showCommandBar}>
      <CommandBar {...cmd} />
    </div>
  )
}
