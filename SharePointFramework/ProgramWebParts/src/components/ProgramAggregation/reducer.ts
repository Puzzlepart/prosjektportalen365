import { createAction, createReducer, current } from '@reduxjs/toolkit'
import sortArray from 'array-sort'
import { Target } from 'office-ui-fabric-react/lib/Callout'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { DataSource } from 'pp365-shared/lib/models/DataSource'
import { indexOf, omit } from 'underscore'
import { IProgramAggregationProps, IProgramAggregationState } from './types'

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
export const DATA_FETCHED = createAction<{
  items: any[]
  projects?: any[]
}>('DATA_FETCHED')
export const TOGGLE_COMPACT = createAction<{ isCompact: boolean }>('TOGGLE_COMPACT')
export const COLUMN_HEADER_CONTEXT_MENU = createAction<{
  column: IColumn
  target: Target
}>('COLUMN_HEADER_CONTEXT_MENU')
export const SET_GROUP_BY = createAction<{ column: IColumn }>('SET_GROUP_BY')
export const SET_SORT = createAction<{ column: IColumn; sortDesencing: boolean }>('SET_SORT')
export const MOVE_COLUMN = createAction<{ column: IColumn; move: number }>('MOVE_COLUMN')
export const SET_CURRENT_VIEW = createAction('SET_CURRENT_VIEW')
export const SET_DATA_SOURCE = createAction<{ dataSource: DataSource }>('SET_DATA_SOURCE')
export const START_FETCH = createAction('START_FETCH')
export const SEARCH = createAction<{ searchTerm: string }>('SEARCH')
export const GET_FILTERS = createAction<{ filters: any[] }>('GET_FILTERS')
export const ON_FILTER_CHANGE = createAction<{
  column: IColumn
  selectedItems: any[]
}>('ON_FILTER_CHANGE')
export const DATA_FETCH_ERROR = createAction<{ error: Error }>('DATA_FETCH_ERROR')

/**
 * Persist columns in web part properties
 *
 * @param props - Props
 * @param columns - State
 */
const persistColumns = (props: IProgramAggregationProps, columns: IColumn[]) => {
  props.onUpdateProperty(
    'columns',
    columns.map((col) => omit(col, 'calculatedWidth', 'currentWidth'))
  )
}

export const initState = (props: IProgramAggregationProps): IProgramAggregationState => ({
  loading: true,
  isCompact: false,
  searchTerm: '',
  items: [],
  columns: props.columns || [],
  dataSource: props.dataSource,
  groups: null
})

/**
 * Create reducer for Projects
 */
export default (props: IProgramAggregationProps) =>
  createReducer(initState(props), {
    [DATA_FETCHED.type]: (state, { payload }: ReturnType<typeof DATA_FETCHED>) => {
      if (payload.items) {
        state.items = payload.items
        state.items = sortArray(
          [...state.items],
          [state.sortBy?.fieldName ? state.sortBy.fieldName : 'SiteTitle'],
          {
            reverse: state.sortBy?.isSortedDescending ? state.sortBy.isSortedDescending : false
          }
        )

        if (payload.projects) {
          state.items = state.items.filter((item) => {
            return payload.projects.find((project) => {
              return project.GtSiteId === item.SiteId
            })
          })
        }

        state.loading = false
      }
    },
    [TOGGLE_COMPACT.type]: (state, { payload }: ReturnType<typeof TOGGLE_COMPACT>) => {
      state.isCompact = payload.isCompact
    },
    [SET_SORT.type]: (state, { payload }: ReturnType<typeof SET_SORT>) => {
      const { column, sortDesencing } = payload
      state.sortBy = column
      if (state.groupBy) {
        state.groupBy = null
        state.groups = null
      }
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
    [START_FETCH.type]: (state) => {
      state.loading = true
    },
    [SEARCH.type]: (state, { payload }: ReturnType<typeof SEARCH>) => {
      state.searchTerm = payload.searchTerm
    },
    [DATA_FETCH_ERROR.type]: (state, { payload }: ReturnType<typeof DATA_FETCH_ERROR>) => {
      state.error = payload.error
    }
  })
