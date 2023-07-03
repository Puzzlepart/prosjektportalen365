import { format, IObjectWithKey, MessageBarType, Selection } from '@fluentui/react'
import { createAction, createReducer } from '@reduxjs/toolkit'
import sortArray from 'array-sort'
import strings from 'PortfolioWebPartsStrings'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import {
  PortfolioOverviewView,
  ProjectColumn,
  ProjectColumnCustomSort
} from 'pp365-shared-library/lib/models'
import _ from 'underscore'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from './types'
import { IColumnFormPanel } from './ColumnFormPanel/types'

interface IPortfolioOverviewReducerParams {
  props: IPortfolioOverviewProps
  placeholderColumns?: ProjectColumn[]
}

/**
 * `STARTING_DATA_FETCH`: Action dispatched when data fetch is started
 */
export const STARTING_DATA_FETCH = createAction('STARTING_DATA_FETCH')

/**
 * `DATA_FETCHED`: Action dispatched when data is fetched from SharePoint
 */
export const DATA_FETCHED = createAction<{
  items: any[]
  currentView: PortfolioOverviewView
  groupBy: ProjectColumn
}>('DATA_FETCHED')

/**
 * `DATA_FETCH_ERROR`: Action dispatched when data fetch fails
 */
export const DATA_FETCH_ERROR = createAction<{ error: Error; view: PortfolioOverviewView }>(
  'DATA_FETCH_ERROR'
)

/**
 * `EXECUTE_SEARCH`: Action dispatched when user executes a search
 */
export const EXECUTE_SEARCH = createAction<string>('EXECUTE_SEARCH')

/**
 * `TOGGLE_FILTER_PANEL`: Action dispatched when user toggles the filter panel
 */
export const TOGGLE_FILTER_PANEL = createAction('TOGGLE_FILTER_PANEL')

/**
 * `START_EXCEL_EXPORT`: Action dispatched when user starts an Excel export
 */
export const START_EXCEL_EXPORT = createAction('START_EXCEL_EXPORT')

/**
 * `EXCEL_EXPORT_SUCCESS`: Action dispatched when Excel export is successful
 */
export const EXCEL_EXPORT_SUCCESS = createAction('EXCEL_EXPORT_SUCCESS')

/**
 * `EXCEL_EXPORT_ERROR`: Action dispatched when Excel export fails
 */
export const EXCEL_EXPORT_ERROR = createAction<Error>('EXCEL_EXPORT_ERROR')

/**
 * `TOGGLE_COMPACT`: Action dispatched when user toggles compact mode for the list
 */
export const TOGGLE_COMPACT = createAction('TOGGLE_COMPACT')

/**
 * `CHANGE_VIEW`: Action dispatched when user changes the view
 */
export const CHANGE_VIEW = createAction<PortfolioOverviewView>('CHANGE_VIEW')

/**
 * `ON_FILTER_CHANGED`: Action dispatched when user changes a filter
 */
export const ON_FILTER_CHANGED = createAction<{
  column: ProjectColumn
  selectedItems: IFilterItemProps[]
}>('ON_FILTER_CHANGED')

/**
 * `TOGGLE_COLUMN_CONTEXT_MENU`: Action dispatched when user opens the column context menu
 */
export const TOGGLE_COLUMN_CONTEXT_MENU = createAction<
  IPortfolioOverviewState['columnContextMenu']
>('TOGGLE_COLUMN_CONTEXT_MENU')

/**
 * `SET_GROUP_BY`: Action dispatched when user changes the group by column
 */
export const SET_GROUP_BY = createAction<ProjectColumn>('SET_GROUP_BY')

/**
 * `SET_SORT`: Action dispatched when user changes the sort column
 */
export const SET_SORT = createAction<{
  column: ProjectColumn
  isSortedDescending?: boolean
  customSort?: ProjectColumnCustomSort
}>('SET_SORT')

/**
 * `SELECTION_CHANGED`: Action dispatched when user changes the selection in the list
 */
export const SELECTION_CHANGED = createAction<Selection<IObjectWithKey>>('SELECTION_CHANGED')

/**
 * `TOGGLE_COLUMN_FORM_PANEL`: Toggling the column form panel.
 */
export const TOGGLE_COLUMN_FORM_PANEL = createAction<IColumnFormPanel>('TOGGLE_COLUMN_FORM_PANEL')

/**
 * `COLUMN_FORM_PANEL_ON_SAVED`: Column form panel on saved.
 */
export const COLUMN_FORM_PANEL_ON_SAVED = createAction<{
  column: ProjectColumn
  isNew: boolean
}>('COLUMN_FORM_PANEL_ON_SAVED')

/**
 * `COLUMN_DELETED`: Column deleted - updates the `columns` and `columnForm` state
 */
export const COLUMN_DELETED = createAction<{ columnId: any }>('COLUMN_DELETED')

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
    columnContextMenu: null
  }
}

/**
 * Create reducer for `<PortfolioOverview />`
 *
 * Handles the following actions:
 *
 * - `STARTING_DATA_FETCH`: Action dispatched when data fetch is started
 * - `DATA_FETCHED`: Action dispatched when data is fetched from SharePoint
 * - `DATA_FETCH_ERROR`: Action dispatched when data fetch fails
 * - `EXECUTE_SEARCH`: Action dispatched when user executes a search
 * - `TOGGLE_FILTER_PANEL`: Action dispatched when user toggles the filter panel
 * - `START_EXCEL_EXPORT`: Action dispatched when user starts an Excel export
 * - `EXCEL_EXPORT_SUCCESS`: Action dispatched when Excel export is successful
 * - `EXCEL_EXPORT_ERROR`: Action dispatched when Excel export fails
 * - `TOGGLE_COMPACT`: Action dispatched when user toggles compact mode for the list
 * - `CHANGE_VIEW`: Action dispatched when user changes the view
 * - `ON_FILTER_CHANGED`: Action dispatched when user changes a filter
 * - `TOGGLE_COLUMN_CONTEXT_MENU`: Action dispatched when user opens the column context menu
 * - `SET_GROUP_BY`: Action dispatched when user changes the group by column
 * - `SET_SORT`: Action dispatched when user changes the sort column
 * - `SELECTION_CHANGED`: Action dispatched when user changes the selection in the list
 * - `TOGGLE_COLUMN_FORM_PANEL`: Toggling the column form panel
 * - `COLUMN_FORM_PANEL_ON_SAVED`: Column form panel on saved
 * - `COLUMN_DELETED`: Column deleted - updates the `columns` and `columnForm` state
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
  })

export default $createReducer
