import { createAction, createReducer, current } from '@reduxjs/toolkit'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'

export const DATA_FETCHED = createAction<{ items: any[] }>(
    'DATA_FETCHED'
)
export const TOGGLE_ADD_COLUMN_PANEL = createAction<{ isOpen: boolean }>(
    'TOGGLE_ADD_COLUMN_PANEL'
)
export const ADD_COLUMN = createAction<{ column: IColumn }>(
    'ADD_COLUMN'
)

export const initState = (props: IPortfolioAggregationProps): IPortfolioAggregationState => ({
    loading: true,
    items: [],
    columns: props.columns,
})

/**
 * Create reducer for Projects
 */
export default (props: IPortfolioAggregationProps) =>
    createReducer(initState(props), {
        [DATA_FETCHED.type]: (state, { payload }: ReturnType<typeof DATA_FETCHED>) => {
            state.items = payload.items
            state.loading = false
        },

        [TOGGLE_ADD_COLUMN_PANEL.type]: (state, { payload }: ReturnType<typeof TOGGLE_ADD_COLUMN_PANEL>) => {
            state.addColumnPanel = { isOpen: payload.isOpen }
        },

        [ADD_COLUMN.type]: (state, { payload }: ReturnType<typeof ADD_COLUMN>) => {
            state.columns = [...state.columns, payload.column]
            props.onUpdateProperty('columns', current(state).columns)
        },
    })