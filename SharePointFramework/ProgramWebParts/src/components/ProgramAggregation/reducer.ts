import { IColumn, Target, IGroup } from '@fluentui/react'
import { get, uniq } from '@microsoft/sp-lodash-subset'
import { createAction, createReducer } from '@reduxjs/toolkit'
import sortArray from 'array-sort'
import strings from 'ProgramWebPartsStrings'
import { IProgramAggregationProps, IProgramAggregationState } from './types'

export const DATA_FETCHED = createAction<{
  items: any[]
  projects?: any[]
}>('DATA_FETCHED')
export const COLUMN_HEADER_CONTEXT_MENU = createAction<{
  column: IColumn
  target: Target
}>('COLUMN_HEADER_CONTEXT_MENU')
export const SET_GROUP_BY = createAction<{ column: IColumn }>('SET_GROUP_BY')
export const SET_SORT = createAction<{ column: IColumn; sortDesencing: boolean }>('SET_SORT')
export const START_FETCH = createAction('START_FETCH')
export const SEARCH = createAction<{ searchTerm: string }>('SEARCH')
export const GET_FILTERS = createAction<{ filters: any[] }>('GET_FILTERS')
export const ON_FILTER_CHANGE = createAction<{
  column: IColumn
  selectedItems: any[]
}>('ON_FILTER_CHANGE')
export const DATA_FETCH_ERROR = createAction<{ error: Error }>('DATA_FETCH_ERROR')

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
 * Create reducer for ProgramAggregation component
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
    [START_FETCH.type]: (state) => {
      state.loading = true
    },
    [SEARCH.type]: (state, { payload }: ReturnType<typeof SEARCH>) => {
      state.searchTerm = payload.searchTerm
    },
    [DATA_FETCH_ERROR.type]: (state, { payload }: ReturnType<typeof DATA_FETCH_ERROR>) => {
      state.error = payload.error
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
      if (payload.column && payload.column.fieldName !== state.groupBy?.fieldName) {
        state.items = sortArray([...state.items], [payload.column.fieldName])
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
      } else {
        state.groups = null
        state.groupBy = null
        state.items = state.items = sortArray(
          [...state.items],
          [state.sortBy?.fieldName ? state.sortBy.fieldName : 'SiteTitle'],
          {
            reverse: state.sortBy?.isSortedDescending ? state.sortBy.isSortedDescending : false
          }
        )
      }
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
    }
  })
