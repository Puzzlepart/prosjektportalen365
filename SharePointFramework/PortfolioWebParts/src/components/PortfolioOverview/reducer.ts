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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const initState = (_props: IPortfolioOverviewProps): IPortfolioOverviewState => ({
  loading: true,
  isCompact: false,
  searchTerm: '',
  activeFilters: {},
  items: [],
  columns: []
})

/**
 * Create reducer for `<PortfolioOverview />`
 * 
 * Handles the following actions:
 * ´DATA_FETCHED´: Action dispatched when data is fetched from SharePoint
 * ´EXECUTE_SEARCH´: Action dispatched when user executes a search
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
    }
  })
