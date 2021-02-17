import { createAction, createReducer, current } from '@reduxjs/toolkit'
import sortArray from 'array-sort'
import { Target } from 'office-ui-fabric-react/lib/Callout'
import { IColumn, IGroup } from 'office-ui-fabric-react/lib/DetailsList'
import * as strings from 'PortfolioWebPartsStrings'
import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'
import { DataSource } from 'pp365-shared/lib/models/DataSource'
import { indexOf, omit, uniq } from 'underscore'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'

function arrayMove<T = any>(arr: T[], old_index: number, new_index: number) {
  const _arr = [...arr]
  if (new_index >= _arr.length) {
    let k = new_index - _arr.length + 1
    while (k--) {
      _arr.push(undefined)
    }
  }
  _arr.splice(new_index, 0, _arr.splice(old_index, 1)[0])
  return _arr
}

export const DATA_FETCHED = createAction<{ items: any[]; dataSources?: DataSource[] }>(
  'DATA_FETCHED'
)
export const TOGGLE_COLUMN_FORM_PANEL = createAction<{ isOpen: boolean; column?: IColumn }>(
  'TOGGLE_COLUMN_FORM_PANEL'
)
export const ADD_COLUMN = createAction<{ column: IColumn }>('ADD_COLUMN')
export const DELETE_COLUMN = createAction('DELETE_COLUMN')
export const COLUMN_HEADER_CONTEXT_MENU = createAction<{ column: IColumn; target: Target }>(
  'COLUMN_HEADER_CONTEXT_MENU'
)
export const SET_GROUP_BY = createAction<{ column: IColumn }>('SET_GROUP_BY')
export const SET_SORT = createAction<{ column: IColumn; sortDesencing: boolean }>('SET_SORT')
export const MOVE_COLUMN = createAction<{ column: IColumn; move: number }>('MOVE_COLUMN')
export const SET_DATA_SOURCE = createAction<{ dataSource: DataSource }>('SET_DATA_SOURCE')
export const START_FETCH = createAction('START_FETCH')
export const SEARCH = createAction<{ searchTerm: string }>('SEARCH')

/**
 * Persist columns in web part properties
 * 
 * @param {IPortfolioAggregationProps} props Props
 * @param {IPortfolioAggregationState} state State
 */
const persistColumns = (props: IPortfolioAggregationProps, columns: IColumn[]) => {
  props.onUpdateProperty('columns', columns.map(col => omit(col, 'calculatedWidth', 'currentWidth')))
}

export const initState = (props: IPortfolioAggregationProps): IPortfolioAggregationState => ({
  loading: true,
  dataSource: props.dataSource,
  dataSources: [],
  items: [],
  searchTerm: '',
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
      if (payload.items) {
        state.items = props.postTransform ? props.postTransform(payload.items) : payload.items
        if (state.sortBy) {
          state.items = sortArray([...state.items], [state.sortBy.fieldName], {
            reverse: state.sortBy.isSortedDescending
          })
        }
        state.loading = false
      }
      if (payload.dataSources) state.dataSources = payload.dataSources
    },

    [TOGGLE_COLUMN_FORM_PANEL.type]: (
      state,
      { payload }: ReturnType<typeof TOGGLE_COLUMN_FORM_PANEL>
    ) => {
      state.editColumn = payload.column || null
      state.addColumnPanel = { isOpen: payload.isOpen }
    },

    [ADD_COLUMN.type]: (state, { payload }: ReturnType<typeof ADD_COLUMN>) => {
      if (state.editColumn) {
        state.columns = [...state.columns].map((c) => {
          if (c.fieldName === payload.column.fieldName) return payload.column
          return c
        })
      } else state.columns = [...state.columns, payload.column]
      state.editColumn = null
      state.addColumnPanel = { isOpen: false }
      state.columnAdded = new Date().getTime()
      persistColumns(props, current(state).columns)
    },

    [DELETE_COLUMN.type]: (state) => {
      state.columns = state.columns.filter((c) => c.fieldName !== state.editColumn.fieldName)
      state.editColumn = null
      state.addColumnPanel = { isOpen: false }
      persistColumns(props, current(state).columns)
    },

    [COLUMN_HEADER_CONTEXT_MENU.type]: (
      state,
      { payload }: ReturnType<typeof COLUMN_HEADER_CONTEXT_MENU>
    ) => {
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
      state.items = sortArray([...state.items], [column.fieldName], { reverse: !sortDesencing })
      state.columns = [...state.columns].map((col) => {
        col.isSorted = col.key === column.key
        if (col.isSorted) {
          col.isSortedDescending = sortDesencing
        }
        return col
      })
    },

    [SET_SORT.type]: (state, { payload }: ReturnType<typeof SET_SORT>) => {
      const { column, sortDesencing } = payload
      state.sortBy = column
      state.items = sortArray([...state.items], [column.fieldName], { reverse: !sortDesencing })
      state.columns = [...state.columns].map((col) => {
        col.isSorted = col.key === column.key
        if (col.isSorted) {
          col.isSortedDescending = sortDesencing
        }
        return col
      })
    },

    [MOVE_COLUMN.type]: (state, { payload }: ReturnType<typeof MOVE_COLUMN>) => {
      const index = indexOf(
        state.columns.map((c) => c.fieldName),
        payload.column.fieldName
      )
      state.columns = arrayMove(current(state).columns, index, index + payload.move)
      persistColumns(props, current(state).columns)
    },

    [SET_DATA_SOURCE.type]: (state, { payload }: ReturnType<typeof SET_DATA_SOURCE>) => {
      state.dataSource = payload.dataSource.title
    },

    [START_FETCH.type]: (state) => {
      state.loading = true
    },

    [SEARCH.type]: (state, { payload }: ReturnType<typeof SEARCH>) => {
      state.searchTerm = payload.searchTerm
    }
  })
