import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { isTaxonomyManagedProperty, parseTaxonomyValue } from 'pp365-shared-library/lib/util'
import { useEffect } from 'react'
import { IPortfolioAggregationContext } from './context'
import { DATA_FETCHED, DATA_FETCH_ERROR, GET_FILTERS, SET_GROUP_BY, START_FETCH } from './reducer'

/**
 * Fetches data for the Portfolio Aggregation component. Resolves the current
 * data source, runs the item search, loads project-level refiner values, and
 * joins each item to its parent project's refiner values via `SiteId`.
 *
 * Project-column `fieldName`s are also added to the item `selectProperties`
 * so the reducer's search-based fallback works for DataSource refiners that
 * don't have an `internalName` match in the refiner-values map.
 */
async function fetchData(context: IPortfolioAggregationContext) {
  const columns = context.props.configuration?.columns ?? []
  const projectRefiners = context.props.configuration?.refiners ?? []
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

  const [items, projectsByDataSource, projectRefinerValues] = await Promise.all([
    context.props.dataAdapter.fetchItemsWithSource(
      dataSource.title,
      context.props.selectProperties ?? selectProperties
    ),
    context.props.dataAdapter.fetchProjectsByDataSource && context.props.configuration
      ? context.props.dataAdapter.fetchProjectsByDataSource(
          context.props.configuration,
          dataSource.title
        )
      : Promise.resolve(undefined),
    context.props.dataAdapter.fetchProjectRefinerValues
      ? context.props.dataAdapter.fetchProjectRefinerValues(projectRefiners)
      : Promise.resolve(new Map<string, Record<string, any>>())
  ])

  const taxonomyFieldNames = _.uniq(
    [...columns, ...context.state.columns, ...projectRefiners]
      .map((col) => col.fieldName)
      .filter((name) => name && isTaxonomyManagedProperty(name))
  )

  const enrichedItems = items.map((item: any) => {
    const refinerValues = item?.SiteId ? projectRefinerValues.get(item.SiteId) : undefined
    if (refinerValues) item.__projectRefinerValues = refinerValues
    for (const key of taxonomyFieldNames) {
      if (item[key] !== undefined && item[key] !== null) {
        item[key] = parseTaxonomyValue(item[key])
      }
      if (item.__projectRefinerValues && item.__projectRefinerValues[key] !== undefined) {
        item.__projectRefinerValues[key] = parseTaxonomyValue(item.__projectRefinerValues[key])
      }
    }
    return item
  })

  const viewColumns = !_.isEmpty(dataSource.columns) ? dataSource.columns : columns
  return { dataSource, items: enrichedItems, columns: viewColumns, projects: projectsByDataSource }
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
        // Project refiners (from Prosjektkolonner, GtIsRefinable=true) win
        // over DataSource refiners on internalName overlap so they land in
        // the grouped, collapsed "Project information" section like Timeline.
        const projectRefiners = context.props.configuration?.refiners ?? []
        const projectRefinerInternalNames = new Set(
          projectRefiners.map((r) => r.internalName).filter(Boolean)
        )
        const dataSourceFilters = (data.dataSource.refiners ?? [])
          .filter((r) => !r.internalName || !projectRefinerInternalNames.has(r.internalName))
          .map((column) => ({ column }))
        const projectFilters = projectRefiners.map((column) => ({
          column,
          group: strings.FilterPanelGroupProjectInformation,
          defaultCollapsed: true
        }))
        context.dispatch(GET_FILTERS({ filters: [...dataSourceFilters, ...projectFilters] }))
        context.dispatch(SET_GROUP_BY({ column: data.dataSource.groupBy }))
      })
      .catch((error) => context.dispatch(DATA_FETCH_ERROR({ error })))
  }, [...deps])
}
