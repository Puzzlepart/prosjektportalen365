import strings from 'PortfolioWebPartsStrings'
import { ColumnRenderComponentRegistry } from '../../List'
import _ from 'lodash'
import { PortfolioOverviewView } from 'pp365-shared-library/lib/models'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { parseUrlHash } from 'pp365-shared-library/lib/util/parseUrlHash'
import { useEffect } from 'react'
import resource from 'SharedResources'
import { IPortfolioOverviewContext } from '../context'
import { DATA_FETCH_ERROR, DATA_FETCHED, STARTING_DATA_FETCH } from '../reducer'
import { PortfolioOverviewErrorMessage } from '../types'
import { usePersistedColumns } from './usePersistedColumns'

/**
 * Get current view from state - otherwise fallback to URL parameter or default view.
 *
 * @param reset Ignore the currently selected view and resolve it again from URL/default settings.
 */
function getCurrentView(
  hashState: Map<string, string | number>,
  context: IPortfolioOverviewContext,
  reset: boolean
): PortfolioOverviewView {
  if (context.state.currentView && !reset) return context.state.currentView
  const viewIdUrlParam = new URLSearchParams(document.location.search).get('viewId')
  const views = context.props.configuration.views
  let currentView = null

  if (viewIdUrlParam) {
    currentView = _.find(views, (v) => v.id.toString() === viewIdUrlParam)
    if (!currentView) {
      throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, 'error')
    }
  } else if (hashState.has('viewId')) {
    currentView = _.find(views, (v) => v.id === hashState.get('viewId'))
    if (!currentView) {
      throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, 'error')
    }
  } else if (context.props.defaultViewId) {
    currentView = _.find(views, (v) => v.id.toString() === context.props.defaultViewId.toString())
    if (!currentView) {
      throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, 'error')
    }
  } else {
    currentView = _.find(views, (v) => v.isDefaultView)
    if (!currentView) {
      throw new PortfolioOverviewErrorMessage(strings.NoDefaultViewMessage, 'error')
    }
  }
  return currentView
}

/**
 * Hook to fetch data `PortfolioOverview`. The internal function `fetchInitialData` is called
 * when the `context.state.currentView` changes. The data is then dispatched to the reducer.
 * The columns are persisted in local storage using `set` from the hook `usePersistedColumns`.
 * This is done to use placeholders for the columns while the data is being fetched on the first
 * render.
 *
 * A fetch that fails is counted for usage statistics, once, by its error code, for the web part
 * the overview is in; so is each hub a merged view could not read.
 */
export const useFetchData = (context: IPortfolioOverviewContext) => {
  const [, set] = usePersistedColumns(context.props)
  const telemetry = useTelemetry()

  const fetchInitialData = async (reset = false) => {
    let currentView: PortfolioOverviewView = null
    try {
      context.dispatch(STARTING_DATA_FETCH())
      const hashState = parseUrlHash()
      currentView = getCurrentView(hashState, context, reset)

      const shouldFetchMerged =
        context.state.isMergedView &&
        context.props.portfolios &&
        context.props.portfolios.length > 1

      const fetchViewData = shouldFetchMerged
        ? context.props.dataAdapter.fetchMergedViewData(
            currentView,
            context.props.portfolios,
            context.props.configuration
          )
        : context.props.isParentProject
          ? context.props.dataAdapter.fetchDataForViewBatch(
              currentView,
              context.props.configuration,
              context.props.configuration.hubSiteId
            )
          : context.props.dataAdapter.fetchDataForView(
              currentView,
              context.props.configuration,
              context.props.configuration.hubSiteId
            )

      const [viewData, isUserInPortfolioManagerGroup] = await Promise.all([
        fetchViewData,
        context.props.dataAdapter.isUserInGroup?.(
          resource.Security_SiteGroup_PortfolioInsight_Title
        ) ?? Promise.resolve(false)
      ])
      const { items, managedProperties, failedPortfolios, failedPortfolioErrors } = viewData
      // The view is shown without those hubs and says so; each is counted by what it failed with.
      failedPortfolioErrors?.forEach((error) => telemetry.trackError(error))

      // `globalSettings` is only populated in program/parent context, so this stays false elsewhere.
      const showChildProjectInfoInProgram =
        context.props.dataAdapter.globalSettings?.get('ShowChildProjectInfoInProgram') === '1'

      let groupBy = currentView.groupBy
      if (hashState.has('groupBy') && !groupBy) {
        groupBy = _.find(
          context.props.configuration.columns,
          (fc) => fc.fieldName === hashState.get('groupBy')
        )
      }

      if (!context.props.isParentProject) {
        // Parent projects use a different adapter; per-column auxiliary data is not loaded there.
        for (const column of currentView.columns) {
          const fetchData = ColumnRenderComponentRegistry.getComponent(column.dataType)?.fetchData
          if (typeof fetchData === 'function') {
            _.set(column, 'data.$', await fetchData(context.props.configuration.web, column))
          }
        }
      }

      set(currentView.columns)
      context.dispatch(
        DATA_FETCHED({
          items,
          currentView,
          groupBy,
          managedProperties,
          isUserInPortfolioManagerGroup,
          showChildProjectInfoInProgram,
          failedPortfolios
        })
      )
    } catch (error) {
      telemetry.trackError(error)
      context.dispatch(DATA_FETCH_ERROR({ error, view: currentView }))
    }
  }

  useEffect(() => {
    void fetchInitialData()
  }, [context.state.currentView, context.state.isMergedView])

  useEffect(() => {
    void fetchInitialData(true)
  }, [context.props.selectedPortfolioId])
}
