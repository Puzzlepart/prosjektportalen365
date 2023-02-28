import { useEffect, useMemo, useReducer } from 'react'
import createReducer, { DATA_FETCHED, DATA_FETCH_ERROR, initState, START_FETCH } from './reducer'
import { searchItem } from './search'
import { IProgramAggregationProps } from './types'

/**
 * Component logic hook for ProgramAggregation component. This hook is responsible for fetching data and
 * managing state of the component. Uses a React reducer to manage state and dispatch actions.
 *
 * @param props Props for ProgramAggregation component
 */
export const useProgramAggregation = (props: IProgramAggregationProps) => {
  const reducer = useMemo(() => createReducer(props), [])
  const [state, dispatch] = useReducer(reducer, initState(props))
  useEffect(() => {
    dispatch(START_FETCH())
    props.dataAdapter
      .fetchItemsWithSource(
        state.dataSource,
        props.selectProperties || state.columns.map((col) => col.fieldName)
      )
      .then((items) => {
        dispatch(DATA_FETCHED({ items }))
      })
      .catch((error) => dispatch(DATA_FETCH_ERROR({ error })))
  }, [])

  const items = useMemo(() => {
    return {
      listItems: state.items.filter((i) => searchItem(i, state.searchTerm, state.columns)),
      columns: state.columns
    }
  }, [state.searchTerm, state.items, state.columns])

  const ctxValue = useMemo(() => ({ props, state, dispatch }), [state])

  return { state, dispatch, items, ctxValue } as const
}
