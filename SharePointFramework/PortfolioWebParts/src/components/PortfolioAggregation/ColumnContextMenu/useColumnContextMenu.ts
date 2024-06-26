import { ContextualMenuItemType, IContextualMenuItem, format } from '@fluentui/react'
import _ from 'lodash'
import * as strings from 'PortfolioWebPartsStrings'
import { indexOf } from 'underscore'
import { useAddColumn } from '../../List'
import { usePortfolioAggregationContext } from '../context'
import {
  SET_GROUP_BY,
  SET_SORT,
  TOGGLE_COLUMN_FORM_PANEL,
  TOGGLE_EDIT_VIEW_COLUMNS_PANEL
} from '../reducer'
import { useEffect, useState } from 'react'
import { MenuProps, useId } from '@fluentui/react-components'

/**
 * Component logic hook for `ColumnContextMenu`. Handles state and dispatches actions to the reducer.
 **/
export function useColumnContextMenu() {
  const context = usePortfolioAggregationContext()
  const [open, setOpen] = useState(false)
  const { isAddColumn, createContextualMenuItems } = useAddColumn(
    true,
    context.props.pageContext.legacyPageContext.isSiteAdmin
  )
  const onOpenChange: MenuProps['onOpenChange'] = (_, data) => setOpen(data.open)
  const [checkedValues, setCheckedValues] = useState<MenuProps['checkedValues']>({})
  const onCheckedValueChange: MenuProps['onCheckedValueChange'] = (_event, data) => {
    setCheckedValues({ ...checkedValues, [data.name]: [_.last(data.checkedItems)].filter(Boolean) })
  }

  useEffect(() => {
    setOpen(!!context.state.columnContextMenu?.column)
  }, [context.state.columnContextMenu])

  const fluentProviderId = useId('fp-column-context-menu')

  const columnContextMenu = {
    open,
    setOpen,
    onOpenChange,
    onCheckedValueChange,
    checkedValues,
    target: null,
    items: [],
    fluentProviderId
  }

  if (!context.state.columnContextMenu) return columnContextMenu

  const { column, target } = context.state.columnContextMenu
  columnContextMenu.target = target

  const columnIndex = indexOf(
    context.state.columns.map((c) => c.fieldName),
    column.fieldName
  )
  const isColumnEditable = columnIndex !== -1 && !context.props.lockedColumns

  if (isAddColumn(column)) {
    columnContextMenu.items = createContextualMenuItems(
      () => context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true })),
      () => context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: true })),
      context.props.lockedColumns,
      context.props.lockedColumns
    )
  } else {
    columnContextMenu.items = [
      {
        key: 'SORT_DESC',
        data: {
          name: `${column.key}_sort`,
          value: 'desc'
        },
        text: strings.SortDescLabel,
        iconProps: { iconName: 'TextSortAscending' },
        canCheck: true,
        checked: column.isSorted && column.isSortedDescending,
        onClick: () => context.dispatch(SET_SORT({ column, isSortedDescending: true }))
      },
      {
        key: 'SORT_ASC',
        data: {
          name: `${column.key}_sort`,
          value: 'asc'
        },
        text: strings.SortAscLabel,
        iconProps: { iconName: 'TextSortDescending' },
        canCheck: true,
        checked: column.isSorted && !column.isSortedDescending,
        onClick: () => context.dispatch(SET_SORT({ column, isSortedDescending: false }))
      },
      {
        key: 'DIVIDER_01',
        itemType: ContextualMenuItemType.Divider
      },
      {
        key: 'GROUP_BY',
        text: format(strings.GroupByColumnLabel, column.name),
        canCheck: true,
        checked: context.state.groupBy?.fieldName === column.fieldName,
        disabled: !column.data?.isGroupable,
        onClick: () => context.dispatch(SET_GROUP_BY({ column })),
        iconProps: { iconName: 'GroupList' }
      },
      {
        key: 'DIVIDER_02',
        itemType: ContextualMenuItemType.Divider
      },
      {
        key: 'COLUMN_SETTINGS',
        text: strings.ColumnSettingsLabel,
        disabled: !isColumnEditable,
        title: !isColumnEditable && strings.ColumnSettingsDisabledTooltip,
        iconProps: { iconName: 'TableSettings' },
        subMenuProps: {
          items: [
            {
              key: 'EDIT_COLUMN',
              text: strings.EditColumnLabel,
              onClick: () => context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true, column })),
              disabled: true,
              iconProps: { iconName: 'TableCellEdit' }
            },
            {
              key: 'DIVIDER_03',
              itemType: ContextualMenuItemType.Divider
            },
            {
              key: 'SHOW_HIDE_COLUMNS',
              text: strings.ShowHideColumnsLabel,
              onClick: () => context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: true })),
              iconProps: { iconName: 'Eye' }
            },
            {
              key: 'ADD_COLUMN',
              text: strings.AddColumnLabel,
              onClick: () => context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true })),
              iconProps: { iconName: 'Add' },
              disabled: true
            }
          ]
        }
      }
    ].filter(Boolean) as IContextualMenuItem[]
  }

  return columnContextMenu
}
