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
async function fetchData({ props, state }: IPortfolioAggregationContext) {
  let columns: ProjectContentColumn[] = []
  if (props.dataAdapter.fetchProjectContentColumns) {
    columns = await props.dataAdapter.fetchProjectContentColumns(props.dataSourceCategory)
  }
  const selectProperties = [...(columns || []), ...state.columns].map((col) => col.fieldName)
  const [dataSource, items, projects] = await Promise.all([
    props.dataAdapter.dataSourceService.getByName(state.dataSource),
    props.dataAdapter.fetchItemsWithSource(
      state.dataSource,
      props.selectProperties ?? selectProperties
    ),
    props.dataAdapter.fetchProjects
      ? props.dataAdapter.fetchProjects(props.configuration, state.dataSource)
      : Promise.resolve(undefined)
  ])
  return { dataSource, items, columns, projects } as const
}

/**
 * Hook that fetches data for the Portfolio Aggregation component using `fetchData`.
 *
 * @param context Context for the Portfolio Aggregation component
 */
export function usePortfolioAggregationDataFetch(context: IPortfolioAggregationContext) {
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
  }, [
    context.state.columnAddedOrUpdated,
    context.state.columnDeleted,
    context.state.columnShowHide,
    context.state.currentView
  ])
}
