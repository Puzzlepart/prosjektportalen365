import { ProjectContentColumn } from 'pp365-shared-library'
import { useEffect } from 'react'
import { IPortfolioAggregationContext } from './context'
import { DATA_FETCHED, DATA_FETCH_ERROR, GET_FILTERS, SET_GROUP_BY, START_FETCH } from './reducer'

/**
 * Fetching data for the Portfolio Aggregation component. This includes
 * the data source, items, columns and projects.
 *
 * @param context Context for the Portfolio Aggregation component
 */
async function fetchData(context: IPortfolioAggregationContext) {
  let columns: ProjectContentColumn[] = []
  if (context.props.dataAdapter.fetchProjectContentColumns) {
    columns = await context.props.dataAdapter.fetchProjectContentColumns(
      context.props.dataSourceCategory
    )
  }
  const selectProperties = [...(columns || []), ...context.state.columns].map(
    (col) => col.fieldName
  )
  const [dataSource, items, projects] = await Promise.all([
    context.props.dataAdapter.dataSourceService.getByName(context.state.dataSource),
    context.props.dataAdapter.fetchItemsWithSource(
      context.state.dataSource,
      context.props.selectProperties ?? selectProperties
    ),
    context.props.dataAdapter.fetchProjects
      ? context.props.dataAdapter.fetchProjects(
          context.props.configuration,
          context.state.dataSource
        )
      : Promise.resolve(undefined)
  ])
  return { dataSource, items, columns, projects } as const
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
