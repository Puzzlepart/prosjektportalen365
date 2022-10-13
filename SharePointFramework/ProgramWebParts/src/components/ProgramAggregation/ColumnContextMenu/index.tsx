import { IContextualMenuItem, ContextualMenuItemType, format, ContextualMenu } from '@fluentui/react'
import strings from 'ProgramWebPartsStrings'
import React, { FunctionComponent, useContext } from 'react'
import { ProgramAggregationContext } from '../context'
import { COLUMN_HEADER_CONTEXT_MENU, SET_GROUP_BY, SET_SORT } from '../reducer'

export const ColumnContextMenu: FunctionComponent = () => {
  const context = useContext(ProgramAggregationContext)
  if (!context.state.columnContextMenu) return null
  const { column, target } = context.state.columnContextMenu
  const items: IContextualMenuItem[] = [
    {
      key: 'SortDesc',
      name: strings.SortDescLabel,
      canCheck: true,
      checked: column.isSorted && column.isSortedDescending,
      onClick: () => context.dispatch(SET_SORT({ column, sortDesencing: true }))
    },
    {
      key: 'SortAsc',
      name: strings.SortAscLabel,
      canCheck: true,
      checked: column.isSorted && !column.isSortedDescending,
      onClick: () => context.dispatch(SET_SORT({ column, sortDesencing: false }))
    },
    {
      key: 'Divider1',
      itemType: ContextualMenuItemType.Divider
    },
    {
      key: 'GroupBy',
      name: format(strings.GroupByColumnLabel, column.name),
      canCheck: true,
      checked: context.state.groupBy?.fieldName === column.fieldName,
      disabled: !column.data?.isGroupable,
      onClick: () => context.dispatch(SET_GROUP_BY({ column }))
    }
  ].filter((i) => i)
  return (
    <ContextualMenu
      target={target}
      items={items}
      onDismiss={() => context.dispatch(COLUMN_HEADER_CONTEXT_MENU(null))}
    />
  )
}
