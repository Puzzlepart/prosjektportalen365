import { createAction, createReducer, current } from '@reduxjs/toolkit'
import sortArray from 'array-sort'
import { Target } from 'office-ui-fabric-react/lib/Callout'
import { IGroup } from 'office-ui-fabric-react/lib/DetailsList'
import * as strings from 'PortfolioWebPartsStrings'
import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'
import { DataSource } from 'pp365-shared/lib/models/DataSource'
import { indexOf, omit, uniq } from 'underscore'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'
import { IFilterItemProps } from '../FilterPanel'
import _, { filter } from 'lodash'
import { stringIsNullOrEmpty } from '@pnp/common'
import { IProjectContentColumn } from 'interfaces/IProjectContentColumn'

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
  items: any[],
  dataSources?: DataSource[],
  columns?: IProjectContentColumn[],
  fltColumns?: IProjectContentColumn[],
  projects?: any[]
}>('DATA_FETCHED')
export const TOGGLE_COLUMN_FORM_PANEL = createAction<{
  isOpen: boolean,
  column?: IProjectContentColumn
}>('TOGGLE_COLUMN_FORM_PANEL')
export const TOGGLE_SHOW_HIDE_COLUMN_PANEL = createAction<{
  isOpen: boolean,
  columns?: IProjectContentColumn[]
}>('TOGGLE_SHOW_HIDE_COLUMN_PANEL')
export const TOGGLE_FILTER_PANEL = createAction<{ isOpen: boolean }>('TOGGLE_FILTER_PANEL')
export const TOGGLE_COMPACT = createAction<{ isCompact: boolean }>('TOGGLE_COMPACT')
export const ADD_COLUMN = createAction<{ column: IProjectContentColumn }>('ADD_COLUMN')
export const DELETE_COLUMN = createAction('DELETE_COLUMN')
export const SHOW_HIDE_COLUMNS = createAction<{ columns: any[] }>('SHOW_HIDE_COLUMNS')
export const COLUMN_HEADER_CONTEXT_MENU = createAction<{
  column: IProjectContentColumn
  target: Target
}>('COLUMN_HEADER_CONTEXT_MENU')
export const SET_GROUP_BY = createAction<{ column: IProjectContentColumn }>('SET_GROUP_BY')
export const SET_SORT = createAction<{ column: IProjectContentColumn; sortDesencing: boolean }>(
  'SET_SORT'
)
export const MOVE_COLUMN = createAction<{ column: IProjectContentColumn; move: number }>(
  'MOVE_COLUMN'
)
export const SET_DATA_SOURCE = createAction<{ dataSource: DataSource }>('SET_DATA_SOURCE')
export const START_FETCH = createAction('START_FETCH')
export const SEARCH = createAction<{ searchTerm: string }>('SEARCH')
export const GET_FILTERS = createAction<{ filters: any[] }>('GET_FILTERS')
export const ON_FILTER_CHANGE = createAction<{
  column: IProjectContentColumn
  selectedItems: IFilterItemProps[]
}>('ON_FILTER_CHANGE')
export const DATA_FETCH_ERROR = createAction<{ error: Error }>('DATA_FETCH_ERROR')

/**
 * Persist columns in web part properties
 *
 * @param props - Props
 * @param columns - State
 */
const persistColumns = (props: IPortfolioAggregationProps, columns: IProjectContentColumn[]) => {
  props.onUpdateProperty(
    'columns',
    columns.map((col) => omit(col, 'calculatedWidth', 'currentWidth'))
  )
}

export const initState = (props: IPortfolioAggregationProps): IPortfolioAggregationState => ({
  loading: true,
  isCompact: false,
  searchTerm: '',
  activeFilters: {},
  filters: [],
  items: [],
  columns: props.columns || [],
  dataSource: props.dataSource,
  dataSources: [],
  groups: null,
  addColumnPanel: { isOpen: false },
  showHideColumnPanel: { isOpen: false }
})

/**
 * Create reducer for Projects
 */
export default (props: IPortfolioAggregationProps) =>
  createReducer(initState(props), {
    [DATA_FETCHED.type]: (state, { payload }: ReturnType<typeof DATA_FETCHED>) => {      
      if (payload.items) {
        state.items = props.postTransform ? props.postTransform(payload.items) : payload.items
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
      if (payload.columns) {
        if (payload.fltColumns.length > 0)
          state.fltColumns = payload.fltColumns
        else
          state.fltColumns = payload.columns

        if (payload.columns.length > 0) {
          const mergedColumns = state.columns.map((col) => {
            const payCol = payload.columns.find((c) => c.key === col.key)
            if (payCol)
              return {
                ...col,
                id: payCol.id,
                internalName: payCol.internalName,
                minWidth: payCol.minWidth,
                dataType: payCol.dataType,
                data: {
                  renderAs: payCol.dataType ? payCol.dataType.toLowerCase() : 'text'
                }
              }
            else return col
          })

          const newColumns = payload.columns.filter((col) => {
            return !mergedColumns.find((c) => c.key === col.key)
          })

          const filteredColumns = [...mergedColumns, ...newColumns].filter((col) => {
            return payload.columns.find((c) => c.fieldName === col.fieldName)
          })

          if (mergedColumns.length >= 1) state.columns = filteredColumns
          else state.columns = sortArray(payload.columns, 'sortOrder')
        } else {
          state.columns = props.columns || []
        }
      }
      if (payload.dataSources) {
        state.currentView = payload.dataSources.find((ds) => ds.title === state.dataSource)
        state.dataSources = payload.dataSources
      }
    },
    [TOGGLE_COLUMN_FORM_PANEL.type]: (
      state,
      { payload }: ReturnType<typeof TOGGLE_COLUMN_FORM_PANEL>
    ) => {
      state.editColumn = payload.column || null
      state.addColumnPanel = { isOpen: payload.isOpen }
    },
    [TOGGLE_SHOW_HIDE_COLUMN_PANEL.type]: (
      state,
      { payload }: ReturnType<typeof TOGGLE_SHOW_HIDE_COLUMN_PANEL>
    ) => {
      state.showHideColumnPanel = { isOpen: payload.isOpen }
    },
    [TOGGLE_FILTER_PANEL.type]: (state, { payload }: ReturnType<typeof TOGGLE_FILTER_PANEL>) => {
      state.showFilterPanel = payload.isOpen
    },
    [TOGGLE_COMPACT.type]: (state, { payload }: ReturnType<typeof TOGGLE_COMPACT>) => {
      state.isCompact = payload.isCompact
    },
    [ADD_COLUMN.type]: (state, { payload }: ReturnType<typeof ADD_COLUMN>) => {
      if (state.editColumn) {
        state.columns = [...state.columns].map((c) => {
          if (c.fieldName === payload.column.fieldName) return payload.column
          return c
        })
      }
      state.editColumn = null
      state.addColumnPanel = { isOpen: false }
      state.columnAdded = new Date().getTime()
      persistColumns(props, current(state).columns)
    },
    [DELETE_COLUMN.type]: (state) => {
      state.editColumn = null
      state.addColumnPanel = { isOpen: false }
      state.columnDeleted = new Date().getTime()
      persistColumns(props, current(state).columns)
    },
    [SHOW_HIDE_COLUMNS.type]: (state, { payload }: ReturnType<typeof SHOW_HIDE_COLUMNS>) => {
      payload
      state.showHideColumnPanel = { isOpen: false }
      state.columnShowHide = new Date().getTime()
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
      if (payload.column) {
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
      state.activeFilters = {}
    },
    [START_FETCH.type]: (state) => {
      state.loading = true
    },
    [SEARCH.type]: (state, { payload }: ReturnType<typeof SEARCH>) => {
      state.searchTerm = payload.searchTerm
    },
    [GET_FILTERS.type]: (state, { payload }: ReturnType<typeof GET_FILTERS>) => {
      const payloadFilters = payload.filters.map((column) => {
        const uniqueValues = uniq(
          // eslint-disable-next-line prefer-spread
          [].concat.apply(
            [],
            state.items.map((i) => get(i, column.fieldName, '').split(';'))
          )
        )

        let items: IFilterItemProps[] = uniqueValues
          .filter((value: string) => !stringIsNullOrEmpty(value))
          .map((value: string) => ({ name: value, value, selected: false }))
        items = items.sort((a, b) => (a.value > b.value ? 1 : -1))
        return { column, items }
      })

      if (!_.isEmpty(state.activeFilters)) {
        const filteredFields = Object.keys(state.activeFilters)
        filteredFields.forEach((key) => {
          payloadFilters.forEach((filter) => {
            if (filter.column.fieldName === key) {
              state.activeFilters[key].forEach((value) => {
                filter.items.forEach((item) => {
                  if (value === item.name) {
                    item.selected = true
                  }
                })
              })
            }
          })
        })
      }

      state.filters = [
        {
          column: {
            key: 'SelectedColumns',
            fieldName: 'SelectedColumns',
            name: strings.SelectedColumnsLabel,
            minWidth: 0
          },
          items: current(state).columns.map((col) => ({
            name: col.name,
            value: col.fieldName,
            selected: current(state).fltColumns.length > 0
              ? _.some(current(state).fltColumns, (c) => c.fieldName === col.fieldName)
              : true
          })),
          defaultCollapsed: true
        },
        ...payloadFilters
      ]

      state.activeFilters = {
        ...state.activeFilters,
        ['SelectedColumns']: current(state).fltColumns.length > 0
          ? current(state).fltColumns.map((col) => col.fieldName)
          : current(state).columns.map((col) => col.fieldName)
      }
    },
    [ON_FILTER_CHANGE.type]: (state, { payload }: ReturnType<typeof ON_FILTER_CHANGE>) => {
      if (payload.selectedItems.length > 0) {
        state.activeFilters = {
          ...state.activeFilters,
          [payload.column.fieldName]: payload.selectedItems.map((i) => i.value)
        }
      } else {
        state.activeFilters = omit(state.activeFilters, payload.column.fieldName)
      }
      state.filters = state.filters.map((f) => {
        if (payload.column.key === f.column.key) {
          f.items = f.items.map((i) => {
            const isSelected =
              filter(payload.selectedItems, (_i) => _i.value === i.value).length > 0
            return {
              ...i,
              selected: isSelected
            }
          })
        }
        return f
      })
    },
    [DATA_FETCH_ERROR.type]: (state, { payload }: ReturnType<typeof DATA_FETCH_ERROR>) => {
      state.error = payload.error
    }
  })
