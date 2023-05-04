import { getId } from '@fluentui/react'
import { useEffect, useMemo, useReducer } from 'react'
import { IPortfolioAggregationContext } from './context'
import { filterItems } from './filter'
import createReducer, {
  DATA_FETCHED,
  DATA_FETCH_ERROR,
  GET_FILTERS,
  SET_CURRENT_VIEW,
  SET_GROUP_BY,
  START_FETCH,
  initState
} from './reducer'
import { searchItem } from './search'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'

/**
 * Fetching data sources when `dataSourceCategory` or `defaultViewId` changes.
 * 
 * TODO: Check if this is neccessary as we're also fetching this in the web part
 * itself using `this.dataAdapter.getAggregatedListConfig`.
 * 
 * @param context Context for the Portfolio Aggregation component
 */
const usePortfolioAggregationDataSources = ({ props, state, dispatch }: IPortfolioAggregationContext) => {
  useEffect(() => {
    if (props.dataSourceCategory) {
      props.dataAdapter
        .fetchDataSources(props.dataSourceCategory, state.dataSourceLevel)
        .then((dataSources) =>
          dispatch(
            DATA_FETCHED({
              items: null,
              dataSources
            })
          )
        )
        .catch((error) => dispatch(DATA_FETCH_ERROR({ error })))
    }
  }, [props.dataSourceCategory, props.defaultViewId])
}

/**
 * Fetches data for the Portfolio Aggregation component.
 * 
 * @param context Context for the Portfolio Aggregation component
 */
const usePortfolioAggregationDataFetch = ({ props, state, dispatch }: IPortfolioAggregationContext) => {
  useEffect(() => {
    dispatch(START_FETCH())
    if (!state.currentView && props.dataSourceCategory) return
    Promise.all([
      props.dataAdapter.dataSourceService.getByName(state.dataSource),
      props.dataAdapter.fetchItemsWithSource(
        state.dataSource,
        props.selectProperties || state.columns.map((col) => col.fieldName)
      ),
      props.dataAdapter.fetchProjectContentColumns
        ? props.dataAdapter.fetchProjectContentColumns(props.dataSourceCategory)
        : Promise.resolve(undefined),
      props.dataAdapter.fetchProjects
        ? props.dataAdapter.fetchProjects(props.configuration, state.dataSource)
        : Promise.resolve(undefined)
    ])
      .then(([dataSrc, items, projectColumns, projects]) => {
        dispatch(
          DATA_FETCHED({
            items,
            columns: projectColumns,
            fltColumns: dataSrc.projectColumns,
            projects
          })
        )
        dispatch(GET_FILTERS({ filters: dataSrc.projectRefiners }))
        dispatch(SET_GROUP_BY({ column: dataSrc.projectGroupBy }))
      })
      .catch((error) => dispatch(DATA_FETCH_ERROR({ error })))
  }, [state.columnAdded, state.columnDeleted, state.columnShowHide, state.currentView])
}

/**
 * Returns the list items and columns for the Portfolio Aggregation component filtered
 * by the active filters and search term.
 * 
 * @param state State for the Portfolio Aggregation component
 */
const usePortfolioAggregationItems = (state: IPortfolioAggregationState) => {
  return useMemo(() => {
    const filteredItems = filterItems(state.items, state.columns, state.activeFilters)
    return {
      listItems: filteredItems.items.filter((i) => searchItem(i, state.searchTerm, state.columns)),
      columns: filteredItems.columns
    }
  }, [state.columnAdded, state.searchTerm, state.items, state.activeFilters, state.columns])
}

/**
 * Component logic hook for the Portfolio Aggregation component. This
 * hook is responsible for fetching data, managing state and dispatching
 * actions to the reducer.
 *
 * @param props Props for the Portfolio Aggregation component
 */
export const usePortfolioAggregation = (props: IPortfolioAggregationProps) => {
  const reducer = useMemo(() => createReducer(props), [])
  const [state, dispatch] = useReducer(reducer, initState(props))
  const layerHostId = getId('layerHost')

  useEffect(() => {
    if (props.dataSourceCategory) dispatch(SET_CURRENT_VIEW)
  }, [props.dataSourceCategory, props.defaultViewId])


  const ctxValue = useMemo<IPortfolioAggregationContext>(() => ({ props, state, dispatch }), [state])

  usePortfolioAggregationDataSources(ctxValue)
  usePortfolioAggregationDataFetch(ctxValue)
  const items = usePortfolioAggregationItems(state)

  return { state, dispatch, items, layerHostId, ctxValue } as const
}
