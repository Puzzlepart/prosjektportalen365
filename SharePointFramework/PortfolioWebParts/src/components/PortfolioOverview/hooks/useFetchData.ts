import { MessageBarType } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { PortfolioOverviewView } from 'pp365-shared-library/lib/models'
import { parseUrlHash } from 'pp365-shared-library/lib/util/parseUrlHash'
import { useEffect } from 'react'
import { IPortfolioOverviewContext } from '../context'
import { DATA_FETCHED, DATA_FETCH_ERROR, STARTING_DATA_FETCH } from '../reducer'
import { PortfolioOverviewErrorMessage } from '../types'
import { usePersistedColumns } from './usePersistedColumns'

/**
 * Get current view from state - otherwise fallback to URL parameter or default view.
 *
 * @param hashState Hash state map
 * @param context `PortfolioOverview` context - needs to be passed as a prop to the function
 * as it is not available yet using `useContext` in the function.
 */
function getCurrentView(
  hashState: Map<string, string | number>,
  context: IPortfolioOverviewContext
): PortfolioOverviewView {
  if (context.state.currentView) return context.state.currentView
  const viewIdUrlParam = new URLSearchParams(document.location.search).get('viewId')
  const views = context.props.configuration.views
  let currentView = null

  if (viewIdUrlParam) {
    currentView = _.find(views, (v) => v.id.toString() === viewIdUrlParam)
    if (!currentView) {
      throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error)
    }
  } else if (hashState.has('viewId')) {
    currentView = _.find(views, (v) => v.id === hashState.get('viewId'))
    if (!currentView) {
      throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error)
    }
  } else if (context.props.defaultViewId) {
    currentView = _.find(views, (v) => v.id.toString() === context.props.defaultViewId.toString())
    if (!currentView) {
      throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error)
    }
  } else {
    currentView = _.find(views, (v) => v.isDefaultView)
    if (!currentView) {
      throw new PortfolioOverviewErrorMessage(strings.NoDefaultViewMessage, MessageBarType.error)
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
 * @param context `PortfolioOverview` context needs to be passed as a prop to the hook
 * as it is not available yet using `useContext` in the hook.
 */
export const useFetchData = (context: IPortfolioOverviewContext) => {
  const [, set] = usePersistedColumns(context.props)
  useEffect(() => {
    const fetchInitialData = async () => {
      let currentView: PortfolioOverviewView = null
      try {
        context.dispatch(STARTING_DATA_FETCH())
        const { configuration, pageContext, isParentProject } = context.props
        const hashState = parseUrlHash()
        currentView = getCurrentView(hashState, context)
        const { items, managedProperties } = isParentProject
          ? await context.props.dataAdapter.fetchDataForViewBatch(
              currentView,
              configuration,
              pageContext.legacyPageContext.hubSiteId
            )
          : await context.props.dataAdapter.fetchDataForView(
              currentView,
              configuration,
              pageContext.legacyPageContext.hubSiteId
            )
        let groupBy = currentView.groupBy
        if (hashState.has('groupBy') && !groupBy) {
          groupBy = _.find(configuration.columns, (fc) => fc.fieldName === hashState.get('groupBy'))
        }
        set(currentView.columns)
        context.dispatch(
          DATA_FETCHED({
            items,
            currentView,
            groupBy,
            managedProperties
          })
        )
      } catch (error) {
        context.dispatch(DATA_FETCH_ERROR({ error, view: currentView }))
      }
    }

    fetchInitialData()
  }, [context.state.currentView])
}
