import { getId } from '@fluentui/react'
import { useEffect, useMemo, useReducer } from 'react'
import { filterItems } from './filter'
import createReducer, {
  DATA_FETCHED,
  DATA_FETCH_ERROR,
  GET_FILTERS,
  initState,
  SET_CURRENT_VIEW,
  SET_GROUP_BY,
  START_FETCH
} from './reducer'
import { searchItem } from './search'
import { IPortfolioAggregationProps } from './types'

/**
 * Component logic hook for the Portfolio Aggregation component. This
 * hook is responsible for fetching data, managing state and dispatching.
 *
 * @param props Props for the Portfolio Aggregation component
 */
export const usePortfolioAggregation = (props: IPortfolioAggregationProps) => {
  const reducer = useMemo(() => createReducer(props), [])
  const [state, dispatch] = useReducer(reducer, initState(props))
  const layerHostId = getId('layerHost')

  useEffect(() => {
    if (props.dataSourceCategory) dispatch(SET_CURRENT_VIEW)
  }, [props.dataSourceCategory, props.defaultViewId])

  useEffect(() => {
    if (props.dataSourceCategory) {
      props.dataAdapter
        .fetchDataSources(props.dataSourceCategory)
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

  useEffect(() => {
    dispatch(START_FETCH())
    if (!state.currentView && props.dataSourceCategory) return
    Promise.all([
      props.dataAdapter.dataSourceService.getByName(state.dataSource),
      props.dataAdapter.fetchItemsWithSource(
        state.dataSource,
        props.selectProperties || state.columns.map((col) => col.fieldName)
      ),
      props.dataAdapter.fetchProjectContentColumns
        ? props.dataAdapter.fetchProjectContentColumns(props.dataSourceCategory)
        : Promise.resolve(undefined),
      props.dataAdapter.fetchProjects
        ? props.dataAdapter.fetchProjects(props.configuration, state.dataSource)
        : Promise.resolve(undefined)
    ])
      .then(([dataSrc, items, projectColumns, projects]) => {
        dispatch(
          DATA_FETCHED({
            items,
            columns: projectColumns,
            fltColumns: dataSrc.projectColumns,
            projects
          })
        )
        dispatch(GET_FILTERS({ filters: dataSrc.projectRefiners }))
        dispatch(SET_GROUP_BY({ column: dataSrc.projectGroupBy }))
      })
      .catch((error) => dispatch(DATA_FETCH_ERROR({ error })))
  }, [state.columnAdded, state.columnDeleted, state.columnShowHide, state.currentView])

  const items = useMemo(() => {
    const filteredItems = filterItems(state.items, state.columns, state.activeFilters)
    return {
      listItems: filteredItems.items.filter((i) => searchItem(i, state.searchTerm, state.columns)),
      columns: filteredItems.columns
    }
  }, [state.columnAdded, state.searchTerm, state.items, state.activeFilters, state.columns])

  const ctxValue = useMemo(() => ({ props, state, dispatch }), [state])

  return { state, dispatch, items, layerHostId, ctxValue } as const
}
