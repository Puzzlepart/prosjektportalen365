import { createReducer } from '@reduxjs/toolkit'
import strings from 'PortfolioWebPartsStrings'
import { ProjectColumn, setUrlHash, format } from 'pp365-shared-library'
import _ from 'underscore'
import { sortItems } from '../../List/sortItems'
import { isSameColumn } from '../../EditViewColumnsPanel/columnIdentity'
import { IPortfolioOverviewHashState, IPortfolioOverviewState } from '../types'
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
  PORTFOLIO_SWITCH_FAILED,
  SELECTION_CHANGED,
  SET_GROUP_BY,
  SET_SORT,
  SET_VIEW_FORM_PANEL,
  START_EXCEL_EXPORT,
  STARTING_DATA_FETCH,
  TOGGLE_COLUMN_CONTEXT_MENU,
  TOGGLE_COLUMN_FORM_PANEL,
  TOGGLE_COMPACT,
  TOGGLE_EDIT_VIEW_COLUMNS_PANEL,
  TOGGLE_FILTER_PANEL,
  TOGGLE_MERGED_VIEW
} from './actions'
import { IPortfolioOverviewReducerParams } from './types'

/**
 * Initialize the overview with cached placeholder columns and closed editing panels.
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
 * Create the overview reducer for data, selection, sorting and editing actions.
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
        state.groupBy = payload.groupBy
        const obj: IPortfolioOverviewHashState = {}
        if (state.currentView) obj.viewId = payload.currentView.id.toString()
        if (state.groupBy) obj.groupBy = state.groupBy.fieldName
        setUrlHash(obj)
        state.columns = payload.currentView.columns
        state.managedProperties = payload.managedProperties ?? []
        state.isUserInPortfolioManagerGroup = payload.isUserInPortfolioManagerGroup
        state.mergedViewFailures = (payload.failedPortfolios ?? []).map((p) => p.title)
        state.showChildProjectInfoInProgram = payload.showChildProjectInfoInProgram
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
          type: 'error'
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
        const obj: IPortfolioOverviewHashState = {}
        if (state.currentView) obj.viewId = payload.id.toString()
        if (state.groupBy) obj.groupBy = state.groupBy.fieldName
        setUrlHash(obj)
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
        // The menu anchor is a DOM element, not an Immer draft.
        state.columnContextMenu = payload as any
      })
      .addCase(SET_GROUP_BY, (state, { payload }) => {
        state.groupBy = payload.fieldName === state.groupBy?.fieldName ? null : payload
      })
      .addCase(SET_SORT, (state, { payload }) => {
        const isCustomSort = payload.customSort
        // Without a direction (a custom sort), an unsorted column sorts ascending and a sorted
        // one flips.
        const isSortedDescending = Object.keys(payload).includes('isSortedDescending')
          ? payload.isSortedDescending
          : !!payload.column.isSorted && !payload.column.isSortedDescending
        const ascending = !isSortedDescending
        state.items = sortItems(
          state.items,
          payload.column,
          ascending,
          isCustomSort ? payload.customSort.order : undefined
        )
        state.sortBy = _.pick(payload, ['column', 'customSort'])
        state.columns = state.columns.map((col) => {
          col.isSorted = col.key === payload.column.key
          col.isSortedDescending = col.isSorted ? isSortedDescending : false
          return col
        })
      })
      .addCase(SELECTION_CHANGED, (state, { payload }) => {
        state.selectedItems = payload
      })
      .addCase(TOGGLE_COLUMN_FORM_PANEL, (state, { payload }) => {
        state.columnForm = payload
      })
      .addCase(COLUMN_FORM_PANEL_ON_SAVED, (state, { payload }) => {
        if (payload.isNew) {
          state.columns = [...state.columns, payload.column]
          // The view's own column order, when it has one, gets the new column at the end — as the
          // list does, and as the service saved it.
          if (!_.isEmpty(state.currentView?.columnOrder)) {
            state.currentView.columnOrder = [...state.currentView.columnOrder, payload.column.id]
          }
        } else {
          state.columns = state.columns.map((col) =>
            isSameColumn(col, payload.column) ? payload.column : col
          )
        }
        state.columnForm = { isOpen: false }
      })
      .addCase(COLUMN_DELETED, (state, { payload }) => {
        state.columns = state.columns.filter((c) => c.id !== payload.columnId)
        state.deletedColumnIds = [...(state.deletedColumnIds ?? []), payload.columnId]
        state.columnForm = { isOpen: false }
      })
      .addCase(TOGGLE_EDIT_VIEW_COLUMNS_PANEL, (state, { payload }) => {
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
      .addCase(TOGGLE_MERGED_VIEW, (state, { payload }) => {
        state.isMergedView = payload
        state.isChangingView = true
      })
      .addCase(PORTFOLIO_SWITCH_FAILED, (state, { payload }) => {
        state.isMergedView = payload
        // No fetch follows a switch that changed nothing, and only a fetch ends a change of view:
        // the selectors would stay disabled.
        state.isChangingView = false
      })
  })

export default $createReducer

export * from './actions'
