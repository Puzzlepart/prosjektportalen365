import { DisplayMode } from '@microsoft/sp-core-library'
import { ContextualMenu, ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'PortfolioWebPartsStrings'
import React, { useContext } from 'react'
import { PortfolioAggregationContext } from '../context'
import { COLUMN_HEADER_CONTEXT_MENU, MOVE_COLUMN, SET_GROUP_BY, SET_SORT, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'

export const ColumnContextMenu = () => {
    const { props, state, dispatch } = useContext(PortfolioAggregationContext)
    if (!state.columnContextMenu) return null
    const { column, target } = state.columnContextMenu
    const items: IContextualMenuItem[] = [
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
            key: 'Divider1',
            itemType: ContextualMenuItemType.Divider
        },
        {
            key: 'GroupBy',
            name: format(strings.GroupByColumnLabel, column.name),
            canCheck: true,
            checked: state.groupBy?.fieldName === column.fieldName,
            disabled: !column.data?.isGroupable,
            onClick: () => dispatch(
                SET_GROUP_BY({ column })
            )
        },
        props.displayMode === DisplayMode.Edit && {
            key: 'Divider2',
            itemType: ContextualMenuItemType.Divider
        },
        props.displayMode === DisplayMode.Edit && {
            key: 'MoveLeft',
            name: strings.MoveLeftLabel,
            iconProps: { iconName: 'ChevronLeftMed' },
            onClick: () => dispatch(
                MOVE_COLUMN({ column, move: -1 })
            )
        },
        props.displayMode === DisplayMode.Edit && {
            key: 'MoveRight',
            name: strings.MoveRightLabel,
            iconProps: { iconName: 'ChevronRightMed' },
            onClick: () => dispatch(
                MOVE_COLUMN({ column, move: 1 })
            )
        },
        props.displayMode === DisplayMode.Edit && {
            key: 'Edit',
            name: strings.EditColumnLabel,
            iconProps: { iconName: 'SingleColumnEdit' },
            onClick: () => dispatch(
                TOGGLE_COLUMN_FORM_PANEL({ isOpen: true, column })
            )
        }
    ].filter(i => i)
    return (
        <ContextualMenu
            target={target}
            items={items}
            onDismiss={() => dispatch(
                COLUMN_HEADER_CONTEXT_MENU(null)
            )} />
    )
}