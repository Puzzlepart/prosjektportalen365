import { MessageBarType } from '@fluentui/react'
import { UrlQueryParameterCollection } from '@microsoft/sp-core-library'
import { AnyAction } from '@reduxjs/toolkit'
import _ from 'lodash'
import strings from 'PortfolioWebPartsStrings'
import { PortfolioOverviewView } from 'pp365-shared/lib/models'
import { parseUrlHash } from 'pp365-shared/lib/util/parseUrlHash'
import { useEffect } from 'react'
import { DATA_FETCHED } from './reducer'
import { IPortfolioOverviewHashStateState, IPortfolioOverviewProps, PortfolioOverviewErrorMessage } from './types'

/**
 * Get current view from URL or hash state.
 *
 * @param hashState Hash state
 * @param props Component props for `PortfolioOverview`
 */
function getCurrentView(hashState: IPortfolioOverviewHashStateState, props: IPortfolioOverviewProps): PortfolioOverviewView {
    const viewIdUrlParam = new UrlQueryParameterCollection(document.location.href).getValue(
        'viewId'
    )
    const { configuration, defaultViewId } = props
    const { views } = configuration
    let currentView = null

    if (viewIdUrlParam) {
        currentView = _.find(views, (v) => v.id.toString() === viewIdUrlParam)
        if (!currentView) {
            throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error)
        }
    } else if (hashState.viewId) {
        currentView = _.find(views, (v) => v.id.toString() === hashState.viewId)
        if (!currentView) {
            throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error)
        }
    } else if (defaultViewId) {
        currentView = _.find(views, (v) => v.id.toString() === defaultViewId.toString())
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
 * Hook to fetch initial data for `PortfolioOverview`
 * 
 * @param props Props for `PortfolioOverview`
 * @param dispatch Dispatch function from `useReducer`
 */
export const useFetchInitialData = (props: IPortfolioOverviewProps, dispatch: React.Dispatch<AnyAction>) => {
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { configuration, pageContext, isParentProject } = props
                const hashState = parseUrlHash<IPortfolioOverviewHashStateState>()
                const currentView = getCurrentView(hashState, props)
                const items = isParentProject
                    ? await props.dataAdapter.fetchDataForViewBatch(
                        currentView,
                        configuration,
                        pageContext.legacyPageContext.hubSiteId
                    )
                    : await props.dataAdapter.fetchDataForView(
                        currentView,
                        configuration,
                        pageContext.legacyPageContext.hubSiteId
                    )
                let groupBy = currentView.groupBy
                if (hashState.groupBy && !groupBy) {
                    groupBy = _.find(configuration.columns, (fc) => fc.fieldName === hashState.groupBy)
                }
                dispatch(DATA_FETCHED({
                    items,
                    currentView,
                    groupBy
                }))
            } catch (error) {
                throw error
            }
        }

        fetchInitialData()
    }, [])
}