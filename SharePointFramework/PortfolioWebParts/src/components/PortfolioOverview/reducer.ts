import { createAction, createReducer } from '@reduxjs/toolkit'
import { PortfolioOverviewView, ProjectColumn } from 'pp365-shared/lib/models'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from './types'

/**
 * `DATA_FETCHED`: Action dispatched when data is fetched from SharePoint
 */
export const DATA_FETCHED = createAction<{
  items: any[]
  currentView: PortfolioOverviewView,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const initState = (_props: IPortfolioOverviewProps): IPortfolioOverviewState => ({
  loading: true,
  isCompact: false,
  searchTerm: '',
  activeFilters: {},
  items: [],
  columns: [],
  filters: []
})

/**
 * Create reducer for `<PortfolioOverview />`
 * 
 * Handles the following actions:
 * ´DATA_FETCHED´: Action dispatched when data is fetched from SharePoint
 * ´EXECUTE_SEARCH´: Action dispatched when user executes a search
 * ´TOGGLE_FILTER_PANEL´: Action dispatched when user toggles the filter panel
 * ´START_EXCEL_EXPORT´: Action dispatched when user starts an Excel export
 * ´EXCEL_EXPORT_SUCCESS´: Action dispatched when Excel export is successful
 * ´EXCEL_EXPORT_ERROR´: Action dispatched when Excel export fails
 * ´TOGGLE_COMPACT´: Action dispatched when user toggles compact mode for the list
 * ´CHANGE_VIEW´: Action dispatched when user changes the view
 */
export default (props: IPortfolioOverviewProps) =>
  createReducer(initState(props), {
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
    }
  })
