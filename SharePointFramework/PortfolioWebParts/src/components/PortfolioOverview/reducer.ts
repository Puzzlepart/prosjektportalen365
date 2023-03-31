import { createAction, createReducer } from '@reduxjs/toolkit'
import { IProjectContentColumn } from 'interfaces/IProjectContentColumn'
import { DataSource } from 'pp365-shared/lib/models/DataSource'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from './types'


export const DATA_FETCHED = createAction<{
  items: any[]
  dataSources?: DataSource[]
  columns?: IProjectContentColumn[]
  fltColumns?: IProjectContentColumn[]
  projects?: any[]
}>('DATA_FETCHED')

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const initState = (_props: IPortfolioOverviewProps): IPortfolioOverviewState => ({
  loading: false,
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
 */
export default (props: IPortfolioOverviewProps) =>
  createReducer(initState(props), {
    [DATA_FETCHED.type]: (state, { payload }: ReturnType<typeof DATA_FETCHED>) => {
        // TODO
        // eslint-disable-next-line no-console
        console.log(payload, state)
    }
  })
