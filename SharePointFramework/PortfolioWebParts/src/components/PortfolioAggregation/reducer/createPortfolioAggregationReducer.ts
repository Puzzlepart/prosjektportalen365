import { MessageBarType } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import { createReducer, current } from '@reduxjs/toolkit'
import * as strings from 'PortfolioWebPartsStrings'
import sortArray from 'array-sort'
import _ from 'lodash'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { arrayMove } from 'pp365-shared-library/lib/helpers/arrayMove'
import { getObjectValue as get } from 'pp365-shared-library/lib/helpers/getObjectValue'
import { DataSource } from 'pp365-shared-library/lib/models/DataSource'
import { parseUrlHash, setUrlHash } from 'pp365-shared-library/lib/util'
import { any, first, indexOf, isEmpty, omit, uniq } from 'underscore'
import {
  IPortfolioAggregationHashState,
  IPortfolioAggregationProps,
  IPortfolioAggregationState,
  PortfolioAggregationErrorMessage
} from '../types'
import {
  ADD_COLUMN,
  COLUMN_HEADER_CONTEXT_MENU,
  DATA_FETCHED,
  DATA_FETCH_ERROR,
  DELETE_COLUMN,
  GET_FILTERS,
  MOVE_COLUMN,
  ON_FILTER_CHANGE,
  SEARCH,
  SET_ALL_COLLAPSED,
  SET_COLLAPSED,
  SET_COLUMNS,
  SET_CURRENT_VIEW,
  SET_DATA_SOURCE,
  SET_GROUP_BY,
  SET_SORT,
  SHOW_HIDE_COLUMNS,
  START_FETCH,
  TOGGLE_COLUMN_FORM_PANEL,
  TOGGLE_COMPACT,
  TOGGLE_EDIT_VIEW_COLUMNS_PANEL,
  TOGGLE_FILTER_PANEL
} from './actions'

/**
 * Persist columns in web part properties for `<PortfolioAggregation />` component
 * using the `onUpdateProperty` callback and property key `columns`.
 *
 * @param props Props for `<PortfolioAggregation />` component
 * @param columns Columns to persist to property `columns`
 */
const persistColumnsInWebPartProperties = (
  { onUpdateProperty }: IPortfolioAggregationProps,
  columns: any[]
) => {
  onUpdateProperty(
    'columns',
    columns.map((col) => omit(col, 'calculatedWidth', 'currentWidth', '_item'))
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
  dataSourceColumns: props.columns ?? [],
  dataSource: props.dataSource ?? first(props.configuration.views)?.title,
  dataSources: [],
  dataSourceLevel: props.dataSourceLevel ?? props.configuration?.level,
  groups: null,
  columnForm: { isOpen: false, column: null },
  isEditViewColumnsPanelOpen: false
})

/**
 * Create reducer for `<PortfolioAggregation />`
 *
 * Handles all actions for the component:
 *
 * - `DATA_FETCHED` - Data fetched from data source
 * - `TOGGLE_COLUMN_FORM_PANEL` - Toggle column form panel
 * - `TOGGLE_EDIT_VIEW_COLUMNS_PANEL` - Toggle show/hide column panel
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
 * - `SET_COLUMNS` - Set columns
 *
 * @param props Props for `<PortfolioAggregation />` component
 */
export const createPortfolioAggregationReducer = (props: IPortfolioAggregationProps) =>
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
        if (!isEmpty(payload.dataSource?.columns))
          state.dataSourceColumns = payload.dataSource.columns
        else state.dataSourceColumns = payload.columns

        if (isEmpty(payload.columns)) {
          state.columns = props.columns ?? []
        } else {
          const mergedColumns = current(state).columns.map((col) => {
            const payCol = _.find(payload.columns, (c) => c.key === col.key)
            return payCol
              ? {
                  ...payCol,
                  ...col,
                  id: payCol.id,
                  internalName: payCol.internalName,
                  minWidth: payCol.minWidth,
                  dataType: payCol.dataType,
                  data: {
                    ...payCol.data,
                    ...col.data,
                    renderAs: (col.data.renderAs ?? payCol.dataType ?? 'text').toLowerCase()
                  }
                }
              : col
          })

          const newColumns = payload.columns.filter((col) => {
            return !_.some(mergedColumns, (c) => c.key === col.key)
          })

          const filteredColumns = [...mergedColumns, ...newColumns].filter((col) => {
            return payload.columns.find((c) => c.fieldName === col.fieldName)
          })

          if (mergedColumns.length >= 1) state.columns = filteredColumns
          else state.columns = sortArray(payload.columns, 'sortOrder')
        }
      }
      if (payload.dataSources) state.dataSources = payload.dataSources
    },
    [TOGGLE_COLUMN_FORM_PANEL.type]: (
      state,
      { payload }: ReturnType<typeof TOGGLE_COLUMN_FORM_PANEL>
    ) => {
      state.columnForm = payload
    },
    [TOGGLE_EDIT_VIEW_COLUMNS_PANEL.type]: (
      state,
      { payload }: ReturnType<typeof TOGGLE_EDIT_VIEW_COLUMNS_PANEL>
    ) => {
      state.isEditViewColumnsPanelOpen = payload.isOpen
    },
    [TOGGLE_FILTER_PANEL.type]: (state, { payload }: ReturnType<typeof TOGGLE_FILTER_PANEL>) => {
      state.isFilterPanelOpen = payload.isOpen
    },
    [TOGGLE_COMPACT.type]: (state, { payload }: ReturnType<typeof TOGGLE_COMPACT>) => {
      state.isCompact = payload.isCompact
    },
    [ADD_COLUMN.type]: (state, { payload }: ReturnType<typeof ADD_COLUMN>) => {
      const isEdit = !!state.columnForm?.column
      let columns = [...current(state).columns]
      let dataSourceColumns = [...current(state).dataSourceColumns]
      if (isEdit) {
        columns = columns.map((c) =>
          c.fieldName === payload.column.fieldName ? payload.column : c
        )
        dataSourceColumns = dataSourceColumns.map((c) =>
          c.fieldName === payload.column.fieldName ? payload.column : c
        )
      } else {
        columns = [...columns, payload.column]
        dataSourceColumns = [...dataSourceColumns, payload.column]
      }
      state.columns = columns
      state.dataSourceColumns = dataSourceColumns
      state.columnForm = { isOpen: false }
      state.columnAddedOrUpdated = new Date().getTime()
      persistColumnsInWebPartProperties(props, columns)
    },
    [DELETE_COLUMN.type]: (state) => {
      state.columnForm = { isOpen: false }
      state.columnDeleted = new Date().getTime()
      persistColumnsInWebPartProperties(props, current(state).columns)
    },
    [SHOW_HIDE_COLUMNS.type]: (state) => {
      state.isEditViewColumnsPanelOpen = false
      state.columnShowHide = new Date().getTime()
      persistColumnsInWebPartProperties(props, current(state).columns)
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
      persistColumnsInWebPartProperties(props, current(state).columns)
    },
    [SET_COLUMNS.type]: (state, { payload }: ReturnType<typeof SET_COLUMNS>) => {
      state.columns = payload.columns
      persistColumnsInWebPartProperties(props, current(state).columns)
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
          (v: DataSource) =>
            v.title === props.dataSource || v.id.toString() === props.defaultViewId?.toString()
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
              current(state).dataSourceColumns.length > 0
                ? _.some(current(state).dataSourceColumns, (c) => c.fieldName === col.fieldName)
                : true
          })),
          defaultCollapsed: true
        },
        ...payloadFilters
      ]

      state.activeFilters = {
        ...state.activeFilters,
        ['SelectedColumns']:
          current(state).dataSourceColumns.length > 0
            ? current(state).dataSourceColumns.map((col) => col.fieldName)
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
              _.filter(payload.selectedItems, (_i) => _i.value === i.value).length > 0
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