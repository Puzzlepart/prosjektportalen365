import { createAction, createReducer, current } from '@reduxjs/toolkit'
import { Target } from 'office-ui-fabric-react/lib/Callout'
import { IColumn, IGroup } from 'office-ui-fabric-react/lib/DetailsList'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'
import sortArray from 'array-sort'
import { uniq } from 'underscore'
import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'
import * as strings from 'PortfolioWebPartsStrings'

export const DATA_FETCHED = createAction<{ items: any[] }>(
    'DATA_FETCHED'
)
export const TOGGLE_ADD_COLUMN_PANEL = createAction<{ isOpen: boolean }>(
    'TOGGLE_ADD_COLUMN_PANEL'
)
export const ADD_COLUMN = createAction<{ column: IColumn }>(
    'ADD_COLUMN'
)
export const COLUMN_HEADER_CONTEXT_MENU = createAction<{ column: IColumn, target: Target }>(
    'COLUMN_HEADER_CONTEXT_MENU'
)
export const SET_GROUP_BY = createAction<{ column: IColumn }>(
    'SET_GROUP_BY'
)
export const SET_SORT = createAction<{ column: IColumn, sortDesencing: boolean }>(
    'SET_SORT'
)

export const initState = (props: IPortfolioAggregationProps): IPortfolioAggregationState => ({
    loading: true,
    items: [],
    columns: props.columns,
    groups: null,
    addColumnPanel: { isOpen: false }
})

/**
 * Create reducer for Projects
 */
export default (props: IPortfolioAggregationProps) =>
    createReducer(initState(props), {
        [DATA_FETCHED.type]: (state, { payload }: ReturnType<typeof DATA_FETCHED>) => {
            state.items = payload.items
            if (state.sortBy) {
                state.items = sortArray(
                    [...state.items],
                    [state.sortBy.fieldName],
                    { reverse: state.sortBy.isSortedDescending }
                )
            }
            state.loading = false
        },

        [TOGGLE_ADD_COLUMN_PANEL.type]: (state, { payload }: ReturnType<typeof TOGGLE_ADD_COLUMN_PANEL>) => {
            state.addColumnPanel = { isOpen: payload.isOpen }
        },

        [ADD_COLUMN.type]: (state, { payload }: ReturnType<typeof ADD_COLUMN>) => {
            state.columns = [...state.columns, payload.column]
            props.onUpdateProperty('columns', current(state).columns)
        },

        [COLUMN_HEADER_CONTEXT_MENU.type]: (state, { payload }: ReturnType<typeof COLUMN_HEADER_CONTEXT_MENU>) => {
            state.columnContextMenu = payload
                ? {
                    column: payload.column,
                    target: payload.target as any
                }
                : null
        },

        [SET_GROUP_BY.type]: (state, { payload }: ReturnType<typeof SET_GROUP_BY>) => {
            const itemsSort = { props: [state.groupBy?.fieldName], opts: { reverse: false } }
            if (state.sortBy) {
                itemsSort.props.push(state.sortBy.fieldName)
                itemsSort.opts.reverse = !state.sortBy.isSortedDescending
            }
            state.items = sortArray([...state.items], itemsSort.props, itemsSort.opts)
            if (state.groupBy?.fieldName === payload.column?.fieldName) {
                state.groupBy = null
                state.groups = null
                return
            }
            state.groupBy = payload.column
            const groupNames: string[] = state.items.map((g) =>
                get<string>(g, state.groupBy.fieldName, strings.NotSet)
            )
            const uniqueGroupNames: string[] = uniq(groupNames)
            state.groups = uniqueGroupNames
                .sort((a, b) => (a > b ? 1 : -1))
                .map((name, idx) => {
                    const count = groupNames.filter((n) => n === name).length
                    const group: IGroup = {
                        key: `Group_${idx}`,
                        name: `${state.groupBy.name}: ${name}`,
                        startIndex: groupNames.indexOf(name, 0),
                        count,
                        isShowingAll: count === state.items.length,
                        isDropEnabled: false,
                        isCollapsed: false
                    }
                    return group
                })
        },

        [SET_SORT.type]: (state, { payload }: ReturnType<typeof SET_SORT>) => {
            const { column, sortDesencing } = payload
            state.sortBy = column
            state.items = sortArray(
                [...state.items],
                [column.fieldName],
                { reverse: !sortDesencing }
            )
            state.columns = [...state.columns].map((col) => {
                col.isSorted = col.key === column.key
                if (col.isSorted) {
                    col.isSortedDescending = sortDesencing
                }
                return col
            })
        },
    })