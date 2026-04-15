import strings from 'PortfolioWebPartsStrings'
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
  // Include project-column refiners' `fieldName` (managed property) in the
  // search select properties so their values are available in the returned
  // items. Without this, any `GtIsRefinable=true` project column that isn't
  // also listed as a DataSource column would have no values and its filter
  // would be hidden by the "items.length > 1" guard in FilterPanel.
  const projectRefiners = context.props.configuration.refiners ?? []
  const selectProperties = _.uniq(
    [...columns, ...context.state.columns, ...projectRefiners]
      .map((col) => col.fieldName)
      .filter(Boolean)
  )

  let dataSource = context.state.currentView
  if (!dataSource) {
    dataSource = await context.props.dataAdapter.dataSourceService.getByName(
      context.props.dataSource
    )
  }

  // Fetch project-level refiner values via search, keyed by siteId. This
  // uses the same data path as `ProjectTimeline` — user, taxonomy and
  // custom fields all work because search returns pre-rendered managed
  // property values (no `$expand` needed, no REST column-type quirks).
  // Each search item (child risk / benefit / etc.) is joined to its parent
  // project's refiner values so the filter panel can surface all 12+
  // refinable columns consistently with Timeline.
  const [items, projectsByDataSource, projectRefinerValues] = await Promise.all([
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
    context.props.dataAdapter.fetchProjectRefinerValues
      ? context.props.dataAdapter.fetchProjectRefinerValues(projectRefiners)
      : Promise.resolve(new Map<string, Record<string, any>>())
  ])

  const enrichedItems = items.map((item: any) => {
    const siteId = item?.SiteId
    const refinerValues = siteId ? projectRefinerValues.get(siteId) : undefined
    if (refinerValues) item.__projectRefinerValues = refinerValues
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
        // Combine DataSource refiners (ProjectContentColumn) with refinable
        // project columns (ProjectColumn with GtIsRefinable=true). Project
        // refiners are grouped under "Project information" and default to
        // collapsed, mirroring the ProjectTimeline filter panel. When both
        // sources reference the same field (matched on internalName), the
        // project refiner wins so it gets the group + collapsed treatment.
        const projectRefinerInternalNames = new Set(
          (context.props.configuration?.refiners ?? [])
            .map((r) => r.internalName)
            .filter(Boolean)
        )
        const dataSourceFilters = (data.dataSource.refiners ?? [])
          .filter((r) => !r.internalName || !projectRefinerInternalNames.has(r.internalName))
          .map((column) => ({ column }))
        const projectFilters = (context.props.configuration?.refiners ?? []).map((column) => ({
          column,
          group: strings.FilterPanelGroupProjectInformation,
          defaultCollapsed: true
        }))
        context.dispatch(
          GET_FILTERS({ filters: [...dataSourceFilters, ...projectFilters] })
        )
        context.dispatch(SET_GROUP_BY({ column: data.dataSource.groupBy }))
      })
      .catch((error) => context.dispatch(DATA_FETCH_ERROR({ error })))
  }, [...deps])
}
