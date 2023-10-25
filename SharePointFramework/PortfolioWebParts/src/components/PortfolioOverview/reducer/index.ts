import { format, MessageBarType } from '@fluentui/react'
import { createReducer } from '@reduxjs/toolkit'
import sortArray from 'array-sort'
import strings from 'PortfolioWebPartsStrings'
import { ProjectColumn } from 'pp365-shared-library'
import _ from 'underscore'
import { IPortfolioOverviewState } from '../types'
import {
  CHANGE_VIEW,
  COLUMN_DELETED,
  COLUMN_FORM_PANEL_ON_SAVED,
  DATA_FETCH_ERROR,
  DATA_FETCHED,
  EXCEL_EXPORT_ERROR,
  EXCEL_EXPORT_SUCCESS,
  EXECUTE_SEARCH,
  ON_FILTER_CHANGED,
  SELECTION_CHANGED,
  SET_EDIT_VIEW_COLUMNS_PANEL,
  SET_GROUP_BY,
  SET_SORT,
  SET_VIEW_FORM_PANEL,
  START_EXCEL_EXPORT,
  STARTING_DATA_FETCH,
  TOGGLE_COLUMN_CONTEXT_MENU,
  TOGGLE_COLUMN_FORM_PANEL,
  TOGGLE_COMPACT,
  TOGGLE_FILTER_PANEL
} from './actions'
import { IPortfolioOverviewReducerParams } from './types'

/**
 * Get initial state for `<PortfolioOverview />` based on `params` provided.
 *
 * @param params Parameters for reducer state initialization
 */
export const getInitialState = (
  params: IPortfolioOverviewReducerParams
): IPortfolioOverviewState => ({
  loading: true,
  isCompact: false,
  searchTerm: '',
  activeFilters: {},
  items: [],
  columns: params.placeholderColumns,
  filters: [],
  columnForm: { isOpen: false },
  viewForm: { isOpen: false },
  isEditViewColumnsPanelOpen: false,
  columnContextMenu: null
})

/**
 * Create reducer for `<PortfolioOverview />`. Using `ActionReducerMapBuilder`
 * from `@reduxjs/toolkit` to create a reducer with a "fluent" API.
 *
 * @param params Parameters for reducer initialization
 */
const $createReducer = (params: IPortfolioOverviewReducerParams) =>
  createReducer(getInitialState(params), (builder) => {
    builder
      .addCase(STARTING_DATA_FETCH, (state) => {
        state.loading = true
      })
      .addCase(DATA_FETCHED, (state, { payload }) => {
        state.items = payload.items
        state.currentView = payload.currentView
        state.columns = payload.currentView.columns
        state.groupBy = payload.groupBy
        state.managedProperties = payload.managedProperties ?? []
        state.loading = false
        state.error = null
        state.isChangingView = false
      })
      .addCase(DATA_FETCH_ERROR, (state, { payload }) => {
        state.loading = false
        let message = format(strings.PortfolioOverviewDataFetchError, payload.error.message)
        if (payload.view)
          message = format(
            strings.PortfolioOverviewDataFetchErrorView,
            payload.view.title,
            payload.error.message
          )
        state.error = {
          name: payload.error?.name,
          message,
          type: MessageBarType.error
        }
      })
      .addCase(EXECUTE_SEARCH, (state, { payload }) => {
        state.searchTerm = payload.toLowerCase()
      })
      .addCase(TOGGLE_FILTER_PANEL, (state) => {
        state.isFilterPanelOpen = !state.isFilterPanelOpen
      })
      .addCase(START_EXCEL_EXPORT, (state) => {
        state.isExporting = true
      })
      .addCase(EXCEL_EXPORT_SUCCESS, (state) => {
        state.isExporting = false
      })
      .addCase(EXCEL_EXPORT_ERROR, (state) => {
        state.isExporting = false
      })
      .addCase(TOGGLE_COMPACT, (state) => {
        state.isCompact = !state.isCompact
      })
      .addCase(CHANGE_VIEW, (state, { payload }) => {
        state.isChangingView = !!payload
        state.currentView = payload
        state.columns = payload.columns
      })
      .addCase(ON_FILTER_CHANGED, (state, { payload }) => {
        const { column, selectedItems } = payload
        if (_.isEmpty(selectedItems)) {
          delete state.activeFilters[column.fieldName]
        } else {
          state.activeFilters[column.fieldName] = selectedItems.map((i) => i.value)
        }
      })
      .addCase(TOGGLE_COLUMN_CONTEXT_MENU, (state, { payload }) => {
        // Need to cast to any because of a bug in the typings
        state.columnContextMenu = payload as any
      })
      .addCase(SET_GROUP_BY, (state, { payload }) => {
        state.groupBy = payload.fieldName === state.groupBy?.fieldName ? null : payload
      })
      .addCase(SET_SORT, (state, { payload }) => {
        const isCustomSort = payload.customSort
        const isSortedDescending = Object.keys(payload).includes('isSortedDescending')
          ? payload.isSortedDescending
          : !payload.column.isSortedDescending
        if (isCustomSort) {
          state.items = state.items.sort((a, b) => {
            const $a = payload.customSort.order.indexOf(a[payload.column.fieldName])
            const $b = payload.customSort.order.indexOf(b[payload.column.fieldName])
            return isSortedDescending ? $a - $b : $b - $a
          })
        } else {
          state.items = sortArray(state.items, [payload.column.fieldName], {
            reverse: !isSortedDescending
          })
        }
        state.sortBy = _.pick(payload, ['column', 'customSort'])
        state.columns = state.columns.map((col) => {
          col.isSorted = col.key === payload.column.key
          col.isSortedDescending = col.isSorted ? isSortedDescending : false
          return col
        })
      })
      .addCase(SELECTION_CHANGED, (state, { payload }) => {
        state.selectedItems = payload.getSelection()
      })
      .addCase(TOGGLE_COLUMN_FORM_PANEL, (state, { payload }) => {
        state.columnForm = payload
      })
      .addCase(COLUMN_FORM_PANEL_ON_SAVED, (state, { payload }) => {
        if (payload.isNew) {
          state.columns = [...state.columns, payload.column].sort(
            (a, b) => a.sortOrder - b.sortOrder
          )
        } else {
          state.columns = state.columns.map((col) =>
            col.key === payload.column.key ? payload.column : col
          )
        }
        state.columnForm = { isOpen: false }
      })
      .addCase(COLUMN_DELETED, (state, { payload }) => {
        state.columns = state.columns.filter((c) => c.id !== payload.columnId)
        state.columnForm = { isOpen: false }
      })
      .addCase(SET_EDIT_VIEW_COLUMNS_PANEL, (state, { payload }) => {
        state.isEditViewColumnsPanelOpen = payload.isOpen
        if (payload.columns) {
          state.currentView.columns = payload.columns
          state.currentView.columnOrder = payload.revertColumnOrder
            ? []
            : (payload.columns as ProjectColumn[]).map((c) => c.id)
          state.columns = payload.columns
        }
      })
      .addCase(SET_VIEW_FORM_PANEL, (state, { payload }) => {
        state.viewForm = payload
      })
  })

export default $createReducer

export * from './actions'
