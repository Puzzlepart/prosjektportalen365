import { getId } from '@fluentui/react'
import { ProjectContentColumn } from 'pp365-shared-library'
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
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'

/**
 * Fetching data sources when `dataSourceCategory` or `defaultViewId` changes.
 *
 * TODO: Check if this is neccessary as we're also fetching this in the web part
 * itself using `this.dataAdapter.getAggregatedListConfig`.
 *
 * @param context Context for the Portfolio Aggregation component
 */
const usePortfolioAggregationDataSources = ({
  props,
  state,
  dispatch
}: IPortfolioAggregationContext) => {
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
 * Fetching data for the Portfolio Aggregation component. This includes
 * the data source, items, columns and projects.
 *
 * @param context Context for the Portfolio Aggregation component
 */
async function fetchData({ props, state }: IPortfolioAggregationContext) {
  let columns: ProjectContentColumn[] = []
  if (props.dataAdapter.fetchProjectContentColumns) {
    columns = await props.dataAdapter.fetchProjectContentColumns(props.dataSourceCategory)
  }
  const selectProperties = [...(columns || []), ...state.columns].map((col) => col.fieldName)
  const [dataSrc, items, projects] = await Promise.all([
    props.dataAdapter.dataSourceService.getByName(state.dataSource),
    props.dataAdapter.fetchItemsWithSource(
      state.dataSource,
      props.selectProperties ?? selectProperties
    ),
    props.dataAdapter.fetchProjects
      ? props.dataAdapter.fetchProjects(props.configuration, state.dataSource)
      : Promise.resolve(undefined)
  ])
  return { dataSrc, items, columns, projects } as const
}

/**
 * Hook that fetches data for the Portfolio Aggregation component using `fetchData`.
 *
 * @param context Context for the Portfolio Aggregation component
 */
const usePortfolioAggregationDataFetch = (context: IPortfolioAggregationContext) => {
  useEffect(() => {
    context.dispatch(START_FETCH())
    if (!context.state.currentView && context.props.dataSourceCategory) return
    fetchData(context)
      .then((data) => {
        context.dispatch(
          DATA_FETCHED({
            items: data.items,
            columns: data.columns,
            fltColumns: data.dataSrc.projectColumns,
            projects: data.projects
          })
        )
        context.dispatch(GET_FILTERS({ filters: data.dataSrc.projectRefiners }))
        context.dispatch(SET_GROUP_BY({ column: data.dataSrc.projectGroupBy }))
      })
      .catch((error) => context.dispatch(DATA_FETCH_ERROR({ error })))
  }, [
    context.state.columnAdded,
    context.state.columnDeleted,
    context.state.columnShowHide,
    context.state.currentView
  ])
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
    if (props.dataSourceCategory) {
      dispatch(SET_CURRENT_VIEW)
    }
  }, [props.dataSourceCategory, props.defaultViewId])

  const context = useMemo<IPortfolioAggregationContext>(() => ({ props, state, dispatch }), [state])

  usePortfolioAggregationDataSources(context)
  usePortfolioAggregationDataFetch(context)

  const items = usePortfolioAggregationItems(state)

  const editViewColumnsPanelProps = useEditViewColumnsPanel(context)

  return { state, dispatch, items, layerHostId, context, editViewColumnsPanelProps } as const
}
