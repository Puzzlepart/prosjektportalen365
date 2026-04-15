import _ from 'lodash'
import { useEffect } from 'react'
import { IPortfolioAggregationContext } from './context'
import { DATA_FETCHED, DATA_FETCH_ERROR, GET_FILTERS, SET_GROUP_BY, START_FETCH } from './reducer'

/**
 * Fetching data for the Portfolio Aggregation component. This includes
 * the data source (if `state.currentView` is not set), the items, the columns,
 * the data-source-filtered projects (if `props.dataAdapter.fetchProjectsByDataSource`
 * is set), and the enriched projects used to provide project-property-based
 * filter values via `GtIsRefinable` columns.
 *
 * Each search item is joined to its matching `ProjectListModel` via `SiteId`
 * so that the filter panel and filtering logic can read values directly from
 * the authoritative Projects list.
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

  const [items, projectsByDataSource, projects] = await Promise.all([
    context.props.dataAdapter.fetchItemsWithSource(
      dataSource.title,
      context.props.selectProperties ?? selectProperties
    ),
    context.props.dataAdapter.fetchProjectsByDataSource
      ? context.props.dataAdapter.fetchProjectsByDataSource(
          context.props.configuration,
          dataSource.title
        )
      : Promise.resolve(undefined),
    context.props.dataAdapter.fetchProjects
      ? context.props.dataAdapter.fetchProjects()
      : Promise.resolve([])
  ])

  const projectsBySiteId = new Map<string, any>()
  for (const project of projects ?? []) {
    if (project?.siteId) projectsBySiteId.set(project.siteId, project)
  }
  const enrichedItems = items.map((item: any) => {
    const siteId = item?.SiteId
    const project = siteId ? projectsBySiteId.get(siteId) : undefined
    if (project) item.__project = project
    return item
  })

  return { dataSource, items: enrichedItems, columns, projects: projectsByDataSource }
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
        // Merge DataSource refiners (ProjectContentColumn) with refinable
        // project columns (ProjectColumn with GtIsRefinable=true), so the
        // filter panel includes both DataSource-specific refiners and the
        // universal "Project information" filters. De-duplicated by
        // internalName so the same field isn't offered twice.
        const dataSourceRefiners = data.dataSource.refiners ?? []
        const projectRefiners = context.props.configuration?.refiners ?? []
        const seenInternalNames = new Set(
          dataSourceRefiners.map((r) => r.internalName).filter(Boolean)
        )
        const extraProjectRefiners = projectRefiners.filter(
          (r) => r.internalName && !seenInternalNames.has(r.internalName)
        )
        const mergedRefiners = [...dataSourceRefiners, ...extraProjectRefiners]
        context.dispatch(GET_FILTERS({ filters: mergedRefiners }))
        context.dispatch(SET_GROUP_BY({ column: data.dataSource.groupBy }))
      })
      .catch((error) => context.dispatch(DATA_FETCH_ERROR({ error })))
  }, [...deps])
}
