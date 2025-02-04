import _ from 'lodash'
import { useEffect } from 'react'
import { IPortfolioAggregationContext } from './context'
import { DATA_FETCHED, DATA_FETCH_ERROR, GET_FILTERS, SET_GROUP_BY, START_FETCH } from './reducer'

/**
 * Fetching data for the Portfolio Aggregation component. This includes
 * the data source (if `state.currentView` is not set), the items, the columns
 * and the the projects (if `props.dataAdapter.fetchProjects` is set).
 *
 * @param context Context for the Portfolio Aggregation component
 */
async function fetchData(context: IPortfolioAggregationContext) {
  const columns = context.props.configuration.columns ?? []
  const selectProperties = _.uniq(
    [...columns, ...context.state.columns].map((col) => col.fieldName)
  )

  let dataSource = context.state.currentView
  if (!dataSource) {
    dataSource = await context.props.dataAdapter.dataSourceService.getByName(
      context.props.dataSource
    )
  }

  const [items, projects] = await Promise.all([
    context.props.dataAdapter.fetchItemsWithSource(
      dataSource.title,
      context.props.selectProperties ?? selectProperties
    ),
    context.props.dataAdapter.fetchProjects
      ? context.props.dataAdapter.fetchProjects(context.props.configuration, dataSource.title)
      : Promise.resolve(undefined)
  ])
  return { dataSource, items, columns, projects } 
}

/**
 * Hook that fetches data for the Portfolio Aggregation component using `fetchData`.
 *
 * This hook is called when the component is mounted and when one of the
 * specified dependencies changes.
 *
 * @param context Context for the Portfolio Aggregation component
 * @param deps Dependencies that should trigger a new fetch
 */
export function usePortfolioAggregationDataFetch(context: IPortfolioAggregationContext, deps = []) {
  useEffect(() => {
    context.dispatch(START_FETCH())
    if (!context.state.currentView && context.props.dataSourceCategory) return
    fetchData(context)
      .then((data) => {
        context.dispatch(DATA_FETCHED(data))
        context.dispatch(GET_FILTERS({ filters: data.dataSource.refiners }))
        context.dispatch(SET_GROUP_BY({ column: data.dataSource.groupBy }))
      })
      .catch((error) => context.dispatch(DATA_FETCH_ERROR({ error })))
  }, [...deps])
}
