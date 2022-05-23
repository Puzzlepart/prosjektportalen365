import { CommandBar, ICommandBarProps } from 'office-ui-fabric-react/lib/CommandBar'
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu'
import * as strings from 'PortfolioWebPartsStrings'
import ExcelExportService from 'pp365-shared/lib/services/ExcelExportService'
import React, { useContext } from 'react'
import { isEmpty } from 'underscore'
import { PortfolioAggregationContext } from '../context'
import { SET_DATA_SOURCE, TOGGLE_COMPACT, TOGGLE_FILTER_PANEL } from '../reducer'
import _ from 'lodash'

export const Commands = () => {
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
        data: {
          isVisible:
            props.pageContext.legacyPageContext.isSiteAdmin && props.showViewSelector
        },
        onClick: () => console.log('NEW VIEW')
      } as IContextualMenuItem,
      {
        key: 'ViewOptions',
        name: state.dataSource,
        iconProps: { iconName: 'List' },
        buttonStyles: { root: { border: 'none' } },
        itemType: ContextualMenuItemType.Header,
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
            ...state.dataSources.map((ds) => ({
              key: `DataSources_${ds.id}`,
              name: ds.title,
              iconProps: { iconName: ds.iconName || 'DataConnectionLibrary' },
              canCheck: true,
              checked: ds.title === state.dataSource,
              onClick: () => dispatch(SET_DATA_SOURCE({ dataSource: ds }))
            })) as IContextualMenuItem[],
            {
              key: 'Divider02',
              itemType: ContextualMenuItemType.Divider
            },
            {
              key: 'SaveViewAs',
              name: strings.SaveViewAsText,
              disabled: true
            },
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
        data: { isVisible: props.showFilters },
        onClick: (ev,) => {
          ev.preventDefault()
          ev.stopPropagation()
          dispatch(TOGGLE_FILTER_PANEL({ isOpen: true }))
        }
      } as IContextualMenuItem
    )
  }

  console.log(state.filters)

  return (
    <div hidden={!props.showCommandBar}>
      <CommandBar {...cmd} />
    </div>
  )
}
