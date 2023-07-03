import { format, MessageBarType } from '@fluentui/react'
import { createReducer } from '@reduxjs/toolkit'
import sortArray from 'array-sort'
import strings from 'PortfolioWebPartsStrings'
import _ from 'underscore'
import { IPortfolioOverviewState } from '../types'
import { IPortfolioOverviewReducerParams } from './types'
import { CHANGE_VIEW, COLUMN_DELETED, COLUMN_FORM_PANEL_ON_SAVED, DATA_FETCH_ERROR, DATA_FETCHED, EXCEL_EXPORT_ERROR, EXCEL_EXPORT_SUCCESS, EXECUTE_SEARCH, ON_FILTER_CHANGED, SELECTION_CHANGED, SET_GROUP_BY, SET_SORT, START_EXCEL_EXPORT, STARTING_DATA_FETCH, TOGGLE_COLUMN_CONTEXT_MENU, TOGGLE_COLUMN_FORM_PANEL, TOGGLE_COMPACT, TOGGLE_FILTER_PANEL, TOGGLE_EDIT_VIEW_COLUMNS_PANEL } from './actions'


/**
 * Initialize state for `<PortfolioOverview />`
 *
 * @param params Parameters for reducer initialization
 */
export const initState = (params: IPortfolioOverviewReducerParams): IPortfolioOverviewState => {
  return {
    loading: true,
    isCompact: false,
    searchTerm: '',
    activeFilters: {},
    items: [],
    columns: params.placeholderColumns,
    filters: [],
    columnForm: { isOpen: false },
    editViewColumns: { isOpen: false },
    columnContextMenu: null
  }
}

/**
 * Create reducer for `<PortfolioOverview />`
 *
 * @param params Parameters for reducer initialization
 */
const $createReducer = (params: IPortfolioOverviewReducerParams) =>
  createReducer(initState(params), (builder) => {
    builder
      .addCase(STARTING_DATA_FETCH, (state) => {
        state.loading = true
      })
      .addCase(DATA_FETCHED, (state, action) => {
        state.items = action.payload.items
        state.currentView = action.payload.currentView
        state.columns = action.payload.currentView.columns
        state.groupBy = action.payload.groupBy
        state.loading = false
        state.error = null
      })
      .addCase(DATA_FETCH_ERROR, (state, action) => {
        state.loading = false
        let message = format(strings.PortfolioOverviewDataFetchError, action.payload.error.message)
        if (action.payload.view)
          message = format(
            strings.PortfolioOverviewDataFetchErrorView,
            action.payload.view.title,
            action.payload.error.message
          )
        state.error = {
          name: action.payload.error?.name,
          message,
          type: MessageBarType.error
        }
      })
      .addCase(EXECUTE_SEARCH, (state, action) => {
        state.searchTerm = action.payload.toLowerCase()
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
      .addCase(CHANGE_VIEW, (state, action) => {
        state.currentView = action.payload
        state.columns = action.payload.columns
      })
      .addCase(ON_FILTER_CHANGED, (state, action) => {
        const { column, selectedItems } = action.payload
        if (_.isEmpty(selectedItems)) {
          delete state.activeFilters[column.fieldName]
        } else {
          state.activeFilters[column.fieldName] = selectedItems.map((i) => i.value)
        }
      })
      .addCase(TOGGLE_COLUMN_CONTEXT_MENU, (state, action) => {
        // Need to cast to any because of a bug in the typings
        state.columnContextMenu = action.payload as any
      })
      .addCase(SET_GROUP_BY, (state, action) => {
        state.groupBy = action.payload.fieldName === state.groupBy.fieldName ? null : action.payload
      })
      .addCase(SET_SORT, (state, action) => {
        const isSortedDescending = Object.keys(action.payload).includes('isSortedDescending')
          ? action.payload.isSortedDescending
          : !action.payload.column.isSortedDescending
        if (action.payload.customSort) {
          state.items = state.items.sort((a, b) => {
            const $a = action.payload.customSort.order.indexOf(a[action.payload.column.fieldName])
            const $b = action.payload.customSort.order.indexOf(b[action.payload.column.fieldName])
            return isSortedDescending ? $a - $b : $b - $a
          })
        } else {
          switch (action.payload.column.dataType) {
            case 'currency':
              state.items = state.items.sort((a, b) => {
                const $a = parseInt(a[action.payload.column.fieldName])
                const $b = parseInt(b[action.payload.column.fieldName])
                if (!isNaN($a) && isNaN($b)) return -1
                return isSortedDescending ? $a - $b : $b - $a
              })
              break
            default:
              state.items = sortArray(state.items, [action.payload.column.fieldName], {
                reverse: !isSortedDescending
              })
              break
          }
        }
      })
      .addCase(SELECTION_CHANGED, (state, action) => {
        state.selectedItems = action.payload.getSelection()
      })
      .addCase(TOGGLE_COLUMN_FORM_PANEL, (state, action) => {
        state.columnForm = action.payload
      })
      .addCase(COLUMN_FORM_PANEL_ON_SAVED, (state, action) => {
        if (action.payload.isNew) {
          state.columns = [...state.columns, action.payload.column].sort(
            (a, b) => a.sortOrder - b.sortOrder
          )
        } else {
          state.columns = state.columns.map((col) => col.key === action.payload.column.key ? action.payload.column : col)
        }
        state.columnForm = { isOpen: false }
      })
      .addCase(COLUMN_DELETED, (state, action) => {
        state.columns = state.columns.filter((c) => c.id !== action.payload.columnId)
        state.columnForm = { isOpen: false }
      })
      .addCase(TOGGLE_EDIT_VIEW_COLUMNS_PANEL, (state, action) => {
        state.editViewColumns = action.payload
      })
  })

export default $createReducer

export * from './actions'