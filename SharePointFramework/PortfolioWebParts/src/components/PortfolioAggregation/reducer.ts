import { createAction, createReducer, current } from '@reduxjs/toolkit'
import sortArray from 'array-sort'
import * as strings from 'PortfolioWebPartsStrings'
import { getObjectValue as get } from 'pp365-shared-library/lib/helpers/getObjectValue'
import { DataSource } from 'pp365-shared-library/lib/models/DataSource'
import { any, first, indexOf, isEmpty, omit, uniq } from 'underscore'
import {
  IPortfolioAggregationHashState,
  IPortfolioAggregationProps,
  IPortfolioAggregationState,
  PortfolioAggregationErrorMessage
} from './types'
import _, { filter } from 'lodash'
import { stringIsNullOrEmpty } from '@pnp/common'
import { IProjectContentColumn } from 'interfaces/IProjectContentColumn'
import { parseUrlHash, setUrlHash } from 'pp365-shared-library/lib/util'
import { Target, IGroup, MessageBarType } from '@fluentui/react'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'

/**
 * Helper function to move an item in an array.
 *
 * @param arr Array to move items in
 * @param old_index Old index of the item to move
 * @param new_index New index of the item to move
 * @returns Array with moved item
 */
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

/**
 * `DATA_FETCHED`: Fetching data from the data source.
 */
export const DATA_FETCHED = createAction<{
  items: any[]
  dataSources?: DataSource[]
  columns?: IProjectContentColumn[]
  fltColumns?: IProjectContentColumn[]
  projects?: any[]
}>('DATA_FETCHED')

/**
 * `TOGGLE_COLUMN_FORM_PANEL`: Toggling the column form panel.
 */
export const TOGGLE_COLUMN_FORM_PANEL = createAction<{
  isOpen: boolean
  column?: IProjectContentColumn
}>('TOGGLE_COLUMN_FORM_PANEL')

/**
 * `TOGGLE_SHOW_HIDE_COLUMN_PANEL`: Toggling the show/hide column panel.
 */
export const TOGGLE_SHOW_HIDE_COLUMN_PANEL = createAction<{
  isOpen: boolean
}>('TOGGLE_SHOW_HIDE_COLUMN_PANEL')

/**
 * `TOGGLE_FILTER_PANEL`: Toggling the filter panel.
 */
export const TOGGLE_FILTER_PANEL = createAction<{ isOpen: boolean }>('TOGGLE_FILTER_PANEL')

/**
 * `TOGGLE_COMPACT`: Toggling the compact mode.
 */
export const TOGGLE_COMPACT = createAction<{ isCompact: boolean }>('TOGGLE_COMPACT')

/**
 * `ADD_COLUMN`: Add column.
 */
export const ADD_COLUMN = createAction<{ column: IProjectContentColumn }>('ADD_COLUMN')

/**
 * `DELETE_COLUMN`: Delete column.
 */
export const DELETE_COLUMN = createAction('DELETE_COLUMN')

/**
 * `SHOW_HIDE_COLUMNS`: Show/hide columns.
 */
export const SHOW_HIDE_COLUMNS = createAction<{ columns: any[] }>('SHOW_HIDE_COLUMNS')

/**
 * `COLUMN_HEADER_CONTEXT_MENU`: Column header context menu.
 */
export const COLUMN_HEADER_CONTEXT_MENU = createAction<{
  column: IProjectContentColumn
  target: Target
}>('COLUMN_HEADER_CONTEXT_MENU')

/**
 * `SET_GROUP_BY`: Set group by.
 */
export const SET_GROUP_BY = createAction<{ column: IProjectContentColumn }>('SET_GROUP_BY')

/**
 * `SET_COLLAPSED`: Set collapsed.
 */
export const SET_COLLAPSED = createAction<{ group: IGroup }>('SET_COLLAPSED')

/**
 * `SET_ALL_COLLAPSED`: Set all collapsed.
 */
export const SET_ALL_COLLAPSED = createAction<{ isAllCollapsed: boolean }>('SET_ALL_COLLAPSED')

/**
 * `SET_SORT`: Set sort.
 */
export const SET_SORT = createAction<{ column: IProjectContentColumn; sortDesencing: boolean }>(
  'SET_SORT'
)

/**
 * `MOVE_COLUMN`: Move column.
 */
export const MOVE_COLUMN = createAction<{ column: IProjectContentColumn; move: number }>(
  'MOVE_COLUMN'
)

/**
 * `SET_CURRENT_VIEW`: Set current view.
 */
export const SET_CURRENT_VIEW = createAction('SET_CURRENT_VIEW')

/**
 * `SET_DATA_SOURCE`: Set data source.
 */
export const SET_DATA_SOURCE = createAction<{ dataSource: DataSource }>('SET_DATA_SOURCE')

/**
 * `START_FETCH`: Start fetching data from the data source.
 */
export const START_FETCH = createAction('START_FETCH')

/**
 * `SEARCH`: Search.
 */
export const SEARCH = createAction<{ searchTerm: string }>('SEARCH')

/**
 * `GET_FILTERS`: Get filters.
 */
export const GET_FILTERS = createAction<{ filters: any[] }>('GET_FILTERS')

/**
 * `ON_FILTER_CHANGE`: Filter change.
 */
export const ON_FILTER_CHANGE = createAction<{
  column: IProjectContentColumn
  selectedItems: IFilterItemProps[]
}>('ON_FILTER_CHANGE')

/**
 * `DATA_FETCH_ERROR`: Error fetching data from the data source.
 */
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

/**
 * Initial state for `<PortfolioAggregation />` component based on props for the component.
 *
 * @param props Props for `<PortfolioAggregation />` component
 */
export const initState = (props: IPortfolioAggregationProps): IPortfolioAggregationState => ({
  loading: true,
  isCompact: false,
  searchTerm: '',
  activeFilters: {},
  filters: [],
  items: [],
  columns: props.columns ?? [],
  fltColumns: props.columns ?? [],
  dataSource: props.dataSource ?? first(props.configuration.views)?.title,
  dataSources: [],
  dataSourceLevel: props.dataSourceLevel ?? props.configuration?.level,
  groups: null,
  addColumnPanel: { isOpen: false },
  showHideColumnPanel: { isOpen: false }
})

/**
 * Create reducer for `<PortfolioAggregation />`
 *
 * Handles all actions for the component:
 *
 * - `DATA_FETCHED` - Data fetched from data source
 * - `TOGGLE_COLUMN_FORM_PANEL` - Toggle column form panel
 * - `TOGGLE_SHOW_HIDE_COLUMN_PANEL` - Toggle show/hide column panel
 * - `TOGGLE_FILTER_PANEL` - Toggle filter panel
 * - `TOGGLE_COMPACT` - Toggle compact mode
 * - `ADD_COLUMN` - Add column
 * - `DELETE_COLUMN` - Delete column
 * - `SHOW_HIDE_COLUMNS` - Show/hide columns
 * - `COLUMN_HEADER_CONTEXT_MENU` - Column header context menu
 * - `SET_GROUP_BY` - Set group by
 * - `SET_COLLAPSED` - Set collapsed
 * - `SET_ALL_COLLAPSED` - Set all collapsed
 * - `SET_SORT` - Set sort
 * - `MOVE_COLUMN` - Move column
 *
 * @param props Props for `<PortfolioAggregation />` component
 */
const createPortfolioAggregationReducer = (props: IPortfolioAggregationProps) =>
  createReducer(initState(props), {
    [DATA_FETCHED.type]: (state, { payload }: ReturnType<typeof DATA_FETCHED>) => {
      if (payload.items) {
        let items = props.postTransform ? props.postTransform(payload.items) : payload.items
        items = sortArray(
          [...items],
          [state.sortBy?.fieldName ? state.sortBy.fieldName : 'SiteTitle'],
          {
            reverse: state.sortBy?.isSortedDescending ? state.sortBy.isSortedDescending : false
          }
        )
        if (payload.projects) {
          items = items.filter((item) =>
            any(payload.projects, (project) => project.GtSiteId === item.SiteId)
          )
        }
        state.items = items
        state.loading = false
      }
      if (payload.columns) {
        if (!isEmpty(payload.fltColumns)) state.fltColumns = payload.fltColumns
        else state.fltColumns = payload.columns

        if (!isEmpty(payload.columns)) {
          const mergedColumns = state.columns.map((col) => {
            const payCol = payload.columns.find((c) => c.key === col.key)
            if (payCol) {
              const renderAs = (col.data.renderAs ?? payCol.dataType ?? 'text').toLowerCase()
              return {
                ...col,
                id: payCol.id,
                internalName: payCol.internalName,
                minWidth: payCol.minWidth,
                dataType: payCol.dataType,
                data: { renderAs }
              }
            } else return col
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
      if (payload.dataSources) state.dataSources = payload.dataSources
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
    [SET_ALL_COLLAPSED.type]: (state, { payload }: ReturnType<typeof SET_ALL_COLLAPSED>) => {
      state.groups = state.groups.map((g) => {
        return { ...g, isCollapsed: payload.isAllCollapsed }
      })
    },
    [SET_COLLAPSED.type]: (state, { payload }: ReturnType<typeof SET_COLLAPSED>) => {
      const { key, isCollapsed } = payload.group
      state.groups = state.groups.map((g) => {
        if (g.key === key) return { ...g, isCollapsed: !isCollapsed }
        return g
      })
    },
    [SET_GROUP_BY.type]: (state, { payload }: ReturnType<typeof SET_GROUP_BY>) => {
      const { column } = payload
      if (column && column.fieldName !== state.groupBy?.fieldName) {
        state.items = sortArray([...state.items], [column.fieldName])
        state.groupBy = column
        const groupNames: string[] = state.items.map((g) =>
          get<string>(g, state.groupBy.fieldName, strings.NotSet)
        )
        const uniqueGroupNames: string[] = uniq(groupNames)
        state.groups = uniqueGroupNames
          .sort((a, b) => (a > b ? 1 : -1))
          .map((name, idx) => {
            const count = groupNames.filter((n) => n === name).length
            const group = {
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
    },
    [MOVE_COLUMN.type]: (state, { payload }: ReturnType<typeof MOVE_COLUMN>) => {
      const index = indexOf(
        state.columns.map((c) => c.fieldName),
        payload.column.fieldName
      )
      state.columns = arrayMove(current(state).columns, index, index + payload.move)
      persistColumns(props, current(state).columns)
    },
    [SET_CURRENT_VIEW.type]: (state) => {
      const hashState = parseUrlHash<IPortfolioAggregationHashState>()
      const viewIdUrlParam = new URLSearchParams(document.location.href).get('viewId')
      const { views } = props.configuration
      let currentView = null

      if (viewIdUrlParam) {
        currentView = _.find(views, (v) => v.id.toString() === viewIdUrlParam)
      } else if (hashState.viewId) {
        currentView = _.find(views, (v) => v.id.toString() === hashState.viewId)
      } else if (props.dataSource || props.defaultViewId) {
        currentView = _.find(
          views,
          (v: DataSource) => v.title === props.dataSource || v.id.toString() === props.defaultViewId?.toString()
        )
      } else {
        currentView = _.find(views, (v) => v.isDefault)
      }
      if (!currentView && views.length > 0) {
        currentView = first(views)
      }
      if (!currentView) {
        state.error = new PortfolioAggregationErrorMessage(
          strings.ViewNotFoundMessage,
          MessageBarType.error
        )
        return
      }
      const obj: IPortfolioAggregationHashState = {}
      if (currentView) obj.viewId = currentView.id.toString()
      if (state.groupBy) obj.groupBy = state.groupBy.fieldName
      setUrlHash(obj)
      state.currentView = currentView
      state.dataSource = currentView.title
      state.activeFilters = {}
    },
    [SET_DATA_SOURCE.type]: (state, { payload }: ReturnType<typeof SET_DATA_SOURCE>) => {
      const obj: IPortfolioAggregationHashState = {}
      if (state.currentView) obj.viewId = payload.dataSource.id.toString()
      if (state.groupBy) obj.groupBy = state.groupBy.fieldName
      setUrlHash(obj)
      state.dataSource = payload.dataSource.title
      state.currentView = payload.dataSource
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
            selected:
              current(state).fltColumns.length > 0
                ? _.some(current(state).fltColumns, (c) => c.fieldName === col.fieldName)
                : true
          })),
          defaultCollapsed: true
        },
        ...payloadFilters
      ]

      state.activeFilters = {
        ...state.activeFilters,
        ['SelectedColumns']:
          current(state).fltColumns.length > 0
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

export default createPortfolioAggregationReducer
