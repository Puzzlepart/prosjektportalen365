import { ContextualMenuItemType, format, IContextualMenuItem } from '@fluentui/react'
import { DisplayMode } from '@microsoft/sp-core-library'
import * as strings from 'PortfolioWebPartsStrings'
import { useContext } from 'react'
import { indexOf } from 'underscore'
import { PortfolioAggregationContext } from '../context'
import {
  MOVE_COLUMN,
  SET_GROUP_BY,
  SET_SORT,
  TOGGLE_COLUMN_FORM_PANEL,
  TOGGLE_SHOW_HIDE_COLUMN_PANEL
} from '../reducer'

/**
 * Component logic hook for ColumnContextMenu. Handles state and dispatches actions to the reducer.
 **/
export function useColumnContextMenu() {
  const { props, state, dispatch } = useContext(PortfolioAggregationContext)
  if (!state.columnContextMenu) return {}
  const { column, target } = state.columnContextMenu
  const columnIndex = indexOf(
    state.columns.map((c) => c.fieldName),
    column.fieldName
  )
  const isColumnEditable =
    props.displayMode === DisplayMode.Edit && columnIndex !== -1 && !props.lockedColumns

  const addColumnItems: IContextualMenuItem[] = [
    {
      key: 'ADD_COLUMN',
      name: strings.AddColumnText,
      iconProps: { iconName: 'CalculatorAddition' },
      disabled: props.displayMode !== DisplayMode.Edit && !props.lockedColumns,
      onClick: () => dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true }))
    },
    {
      key: 'SHOW_HIDE_COLUMNS',
      name: strings.ShowHideColumnsLabel,
      iconProps: { iconName: 'Settings' },
      onClick: () => dispatch(TOGGLE_SHOW_HIDE_COLUMN_PANEL({ isOpen: true }))
    }
  ]

  const items: IContextualMenuItem[] = [
    {
      key: 'SORT_DESC',
      name: strings.SortDescLabel,
      canCheck: true,
      checked: column.isSorted && column.isSortedDescending,
      onClick: () => dispatch(SET_SORT({ column, sortDesencing: true }))
    },
    {
      key: 'SORT_ASC',
      name: strings.SortAscLabel,
      canCheck: true,
      checked: column.isSorted && !column.isSortedDescending,
      onClick: () => dispatch(SET_SORT({ column, sortDesencing: false }))
    },
    {
      key: 'DIVIDER_01',
      itemType: ContextualMenuItemType.Divider
    },
    {
      key: 'GROUP_BY',
      name: format(strings.GroupByColumnLabel, column.name),
      canCheck: true,
      checked: state.groupBy?.fieldName === column.fieldName,
      disabled: !column.data?.isGroupable,
      onClick: () => dispatch(SET_GROUP_BY({ column }))
    },
    {
      key: 'DIVIDER_02',
      itemType: ContextualMenuItemType.Divider
    },
    {
      key: 'COLUMN_SETTINGS',
      name: strings.ColumnSettingsLabel,
      disabled: !isColumnEditable,
      title: !isColumnEditable && strings.ColumnSettingsDisabledTooltip,
      subMenuProps: {
        items: [
          {
            key: 'EDIT_COLUMN',
            name: strings.EditColumnLabel,
            onClick: () => dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true, column }))
          },
          {
            key: 'MOVE_COLUMN_LEFT',
            name: strings.MoveLeftLabel,
            disabled: columnIndex === 0,
            onClick: () => dispatch(MOVE_COLUMN({ column, move: -1 }))
          },
          {
            key: 'MOVE_COLUMN_RIGHT',
            name: strings.MoveRightLabel,
            disabled: columnIndex === state.columns.length - 1,
            onClick: () => dispatch(MOVE_COLUMN({ column, move: 1 }))
          },
          {
            key: 'DIVIDER_03',
            itemType: ContextualMenuItemType.Divider
          },
          {
            key: 'SHOW_HIDE_COLUMNS',
            name: strings.ShowHideColumnsLabelShort,
            onClick: () => dispatch(TOGGLE_SHOW_HIDE_COLUMN_PANEL({ isOpen: true }))
          },
          {
            key: 'ADD_COLUMN',
            name: strings.AddColumnLabel,
            onClick: () => dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true }))
          }
        ]
      }
    }
  ].filter(Boolean) as IContextualMenuItem[]

  return { target, column, addColumnItems, items, dispatch } as const
}
