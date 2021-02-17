import { ContextualMenu, ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'PortfolioWebPartsStrings'
import React, { useContext } from 'react'
import { PortfolioAggregationContext } from '../context'
import { COLUMN_HEADER_CONTEXT_MENU, SET_GROUP_BY, SET_SORT } from '../reducer'

export const ColumnContextMenu = () => {
    const { state, dispatch } = useContext(PortfolioAggregationContext)
    if (!state.columnContextMenu) return null
    const { column, target } = state.columnContextMenu
    const items = [
        {
            key: 'SortDesc',
            name: strings.SortDescLabel,
            canCheck: true,
            checked: column.isSorted && column.isSortedDescending,
            onClick: () => dispatch(
                SET_SORT({ column, sortDesencing: true })
            )
        },
        {
            key: 'SortAsc',
            name: strings.SortAscLabel,
            canCheck: true,
            checked: column.isSorted && !column.isSortedDescending,
            onClick: () => dispatch(
                SET_SORT({ column, sortDesencing: false })
            )
        },
        {
            key: 'Divider',
            itemType: ContextualMenuItemType.Divider
        },
        {
            key: 'GroupBy',
            name: format(strings.GroupByColumnLabel, ''),
            canCheck: true,
            checked: state.groupBy?.fieldName === column.fieldName,
            disabled: !column['isGroupable'],
            onClick: () => dispatch(
                SET_GROUP_BY({ column })
            )
        }
    ]
    return (
        <ContextualMenu
            target={target}
            items={items}
            onDismiss={() => dispatch(
                COLUMN_HEADER_CONTEXT_MENU(null)
            )} />
    )
}