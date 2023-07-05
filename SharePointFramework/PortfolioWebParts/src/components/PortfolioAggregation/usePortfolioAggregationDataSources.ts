import { useEffect } from 'react'
import { IPortfolioAggregationContext } from './context'
import { DATA_FETCHED, DATA_FETCH_ERROR } from './reducer'

/**
 * Fetching data sources when `dataSourceCategory` or `defaultViewId` changes.
 *
 * TODO: Check if this is neccessary as we're also fetching this in the web part
 * itself using `this.dataAdapter.getAggregatedListConfig`.
 *
 * @param context Context for the Portfolio Aggregation component
 */
export function usePortfolioAggregationDataSources({
  props,
  state,
  dispatch
}: IPortfolioAggregationContext) {
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
