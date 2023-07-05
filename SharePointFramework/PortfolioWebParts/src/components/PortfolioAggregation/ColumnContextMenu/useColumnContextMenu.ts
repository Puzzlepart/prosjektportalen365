import { ContextualMenuItemType, IContextualMenuItem, format } from '@fluentui/react'
import { DisplayMode } from '@microsoft/sp-core-library'
import * as strings from 'PortfolioWebPartsStrings'
import { useContext } from 'react'
import { indexOf } from 'underscore'
import { useAddColumn } from '../../List'
import { PortfolioAggregationContext } from '../context'
import {
  MOVE_COLUMN,
  SET_GROUP_BY,
  SET_SORT,
  TOGGLE_COLUMN_FORM_PANEL,
  TOGGLE_EDIT_VIEW_COLUMNS_PANEL
} from '../reducer'

/**
 * Component logic hook for `ColumnContextMenu`. Handles state and dispatches actions to the reducer.
 **/
export function useColumnContextMenu() {
  const context = useContext(PortfolioAggregationContext)
  if (!context.state.columnContextMenu) return {}
  const { column, target } = context.state.columnContextMenu
  const columnIndex = indexOf(
    context.state.columns.map((c) => c.fieldName),
    column.fieldName
  )
  const isColumnEditable =
    context.props.displayMode === DisplayMode.Edit &&
    columnIndex !== -1 &&
    !context.props.lockedColumns

  const { isAddColumn, createContextualMenuItems } = useAddColumn(true)

  if (isAddColumn(column)) {
    return {
      target,
      items: createContextualMenuItems(
        () => context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true })),
        () => context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: true })),
        context.props.displayMode !== DisplayMode.Edit && !context.props.lockedColumns
      )
    }
  } else {
    return {
      target,
      items: [
        {
          key: 'SORT_DESC',
          name: strings.SortDescLabel,
          canCheck: true,
          checked: column.isSorted && column.isSortedDescending,
          onClick: () => context.dispatch(SET_SORT({ column, sortDesencing: true }))
        },
        {
          key: 'SORT_ASC',
          name: strings.SortAscLabel,
          canCheck: true,
          checked: column.isSorted && !column.isSortedDescending,
          onClick: () => context.dispatch(SET_SORT({ column, sortDesencing: false }))
        },
        {
          key: 'DIVIDER_01',
          itemType: ContextualMenuItemType.Divider
        },
        {
          key: 'GROUP_BY',
          name: format(strings.GroupByColumnLabel, column.name),
          canCheck: true,
          checked: context.state.groupBy?.fieldName === column.fieldName,
          disabled: !column.data?.isGroupable,
          onClick: () => context.dispatch(SET_GROUP_BY({ column }))
        },
        {
          key: 'DIVIDER_02',
          itemType: ContextualMenuItemType.Divider
        },
        {
          key: 'COLUMN_SETTINGS',
          name: strings.ColumnSettingsLabel,
          disabled: !isColumnEditable || context.props.isParentProject,
          title: !isColumnEditable && strings.ColumnSettingsDisabledTooltip,
          subMenuProps: {
            items: [
              {
                key: 'EDIT_COLUMN',
                name: strings.EditColumnLabel,
                onClick: () => context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true, column }))
              },
              {
                key: 'MOVE_COLUMN_LEFT',
                name: strings.MoveLeftLabel,
                disabled: columnIndex === 0,
                onClick: () => context.dispatch(MOVE_COLUMN({ column, move: -1 }))
              },
              {
                key: 'MOVE_COLUMN_RIGHT',
                name: strings.MoveRightLabel,
                disabled: columnIndex === context.state.columns.length - 1,
                onClick: () => context.dispatch(MOVE_COLUMN({ column, move: 1 }))
              },
              {
                key: 'DIVIDER_03',
                itemType: ContextualMenuItemType.Divider
              },
              {
                key: 'SHOW_HIDE_COLUMNS',
                name: strings.ShowHideColumnsLabel,
                onClick: () => context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: true }))
              },
              {
                key: 'ADD_COLUMN',
                name: strings.AddColumnLabel,
                onClick: () => context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true }))
              }
            ]
          }
        }
      ].filter(Boolean) as IContextualMenuItem[]
    }
  }
}
