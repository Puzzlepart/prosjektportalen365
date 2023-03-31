import { createAction, createReducer } from '@reduxjs/toolkit'
import { IFilterItemProps } from 'components/FilterPanel'
import { PortfolioOverviewView, ProjectColumn } from 'pp365-shared/lib/models'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from './types'
import _ from 'underscore'
import { IContextualMenuProps } from '@fluentui/react'
import sortArray from 'array-sort'

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
 * `SET_COLUMN_CONTEXT_MENU`: Action dispatched when user opens the column context menu
 */
export const SET_COLUMN_CONTEXT_MENU = createAction<IContextualMenuProps>('SET_COLUMN_CONTEXT_MENU')

/**
 * `SET_GROUP_BY`: Action dispatched when user changes the group by column
 */
export const SET_GROUP_BY = createAction<ProjectColumn>('SET_GROUP_BY')

/**
 * `SET_SORT`: Action dispatched when user changes the sort column
 */
export const SET_SORT = createAction<{ column: ProjectColumn; isSortedDescending: boolean }>(
  'SET_SORT'
)

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
    filters: []
  }
}

/**
 * Create reducer for `<PortfolioOverview />`
 *
 * Handles the following actions:
 * ´STARTING_DATA_FETCH´: Action dispatched when data fetch is started
 * ´DATA_FETCHED´: Action dispatched when data is fetched from SharePoint
 * ´EXECUTE_SEARCH´: Action dispatched when user executes a search
 * ´TOGGLE_FILTER_PANEL´: Action dispatched when user toggles the filter panel
 * ´START_EXCEL_EXPORT´: Action dispatched when user starts an Excel export
 * ´EXCEL_EXPORT_SUCCESS´: Action dispatched when Excel export is successful
 * ´EXCEL_EXPORT_ERROR´: Action dispatched when Excel export fails
 * ´TOGGLE_COMPACT´: Action dispatched when user toggles compact mode for the list
 * ´CHANGE_VIEW´: Action dispatched when user changes the view
 * ´ON_FILTER_CHANGED´: Action dispatched when user changes a filter
 * ´SET_COLUMN_CONTEXT_MENU´: Action dispatched when user opens the column context menu
 * ´SET_GROUP_BY´: Action dispatched when user changes the group by column
 * ´SET_SORT´: Action dispatched when user changes the sort column
 *
 * @param params Parameters for reducer initialization
 */
export default (params: IPortfolioOverviewReducerParams) =>
  createReducer(initState(params), {
    [STARTING_DATA_FETCH.type]: (state) => {
      state.loading = true
    },
    [DATA_FETCHED.type]: (state, { payload }: ReturnType<typeof DATA_FETCHED>) => {
      state.items = payload.items
      state.currentView = payload.currentView
      state.columns = payload.currentView.columns
      state.groupBy = payload.groupBy
      state.loading = false
    },
    [EXECUTE_SEARCH.type]: (state, { payload }: ReturnType<typeof EXECUTE_SEARCH>) => {
      state.searchTerm = payload.toLowerCase()
    },
    [TOGGLE_FILTER_PANEL.type]: (state) => {
      state.showFilterPanel = !state.showFilterPanel
    },
    [START_EXCEL_EXPORT.type]: (state) => {
      state.isExporting = true
    },
    [EXCEL_EXPORT_SUCCESS.type]: (state) => {
      state.isExporting = false
    },
    [EXCEL_EXPORT_ERROR.type]: (state) => {
      state.isExporting = false
    },
    [TOGGLE_COMPACT.type]: (state) => {
      state.isCompact = !state.isCompact
    },
    [CHANGE_VIEW.type]: (state, { payload }: ReturnType<typeof CHANGE_VIEW>) => {
      state.currentView = payload
      state.columns = payload.columns
    },
    [ON_FILTER_CHANGED.type]: (state, { payload }: ReturnType<typeof ON_FILTER_CHANGED>) => {
      const { column, selectedItems } = payload
      if (_.isEmpty(selectedItems)) {
        delete state.activeFilters[column.fieldName]
      } else {
        state.activeFilters[column.fieldName] = selectedItems.map((i) => i.value)
      }
    },
    [SET_COLUMN_CONTEXT_MENU.type]: (
      state,
      { payload }: ReturnType<typeof SET_COLUMN_CONTEXT_MENU>
    ) => {
      // Need to cast to any because of a bug in the typings
      state.columnContextMenu = payload as any
    },
    [SET_GROUP_BY.type]: (state, { payload }: ReturnType<typeof SET_GROUP_BY>) => {
      state.groupBy = payload
    },
    [SET_SORT.type]: (state, { payload }: ReturnType<typeof SET_SORT>) => {
      const itemsSorted = sortArray(state.items, [payload.column.fieldName], {
        reverse: !payload.isSortedDescending
      })
      state.sortBy = payload.column
      state.items = itemsSorted
      state.columns = state.columns.map((col) => {
        col.isSorted = col.key === payload.column.key
        if (col.isSorted) {
          col.isSortedDescending = payload.isSortedDescending
        }
        return col
      })
    }
  })
