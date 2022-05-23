import { DisplayMode } from '@microsoft/sp-core-library'
import { DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList'
import { Spinner } from 'office-ui-fabric-react/lib/Spinner'
import { UserMessage } from 'pzl-react-reusable-components/lib/UserMessage'
import React, { useEffect, useMemo, useReducer } from 'react'
import { ColumnContextMenu } from './ColumnContextMenu'
import { addColumn, ColumnFormPanel } from './ColumnFormPanel'
import { Commands } from './Commands'
import { PortfolioAggregationContext } from './context'
import { getDefaultColumns, renderItemColumn } from './itemColumn'
import styles from './PortfolioAggregation.module.scss'
import createReducer, {
  COLUMN_HEADER_CONTEXT_MENU,
  DATA_FETCHED,
  DATA_FETCH_ERROR,
  initState,
  START_FETCH
  TOGGLE_FILTER_PANEL
} from './reducer'
import { searchItem } from './search'
import SearchBox from './SearchBox'
import { IPortfolioAggregationProps } from './types'

export const PortfolioAggregation = (props: IPortfolioAggregationProps) => {
  const reducer = useMemo(() => createReducer(props), [])
  const [state, dispatch] = useReducer(reducer, initState(props))
  
  useEffect(() => {
    if (props.dataSourceCategory) {
      props.dataAdapter.configure().then((adapter) => {
        adapter
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
      })
    }
  }, [props.dataSourceCategory])

  useEffect(() => {
    dispatch(START_FETCH())
    props.dataAdapter.configure().then((adapter) => {
      Promise.all([
        adapter.dataSourceService.getByName(state.dataSource),
        adapter
          .fetchItemsWithSource(
            state.dataSource,
            props.selectProperties || state.columns.map((col) => col.fieldName)
          )
      ])
        .then(([dataSrc, items]) => {
          // const items = _items.map(i => {
        })
        .catch((error) => dispatch(DATA_FETCH_ERROR({ error })))
    })
  }, [state.columnAdded, state.dataSource])

  const items = useMemo(() => {
    return state.items.filter((i) => searchItem(i, state.searchTerm, state.columns))
  }, [state.searchTerm, state.items])

  const ctxValue = useMemo(() => ({ props, state, dispatch }), [state])

  if (state.error) {
    return <UserMessage type={MessageBarType.error} text={state.error.message} />
  }

  if (state.loading) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <Spinner label={format(strings.LoadingText, props.title)} />
        </div>
      </div>
    )
  }

  return (
    <PortfolioAggregationContext.Provider value={ctxValue}>
      <div className={styles.root}>
        <Commands />
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
        </div>
        <SearchBox />
        <div className={styles.listContainer}>
          <ShimmeredDetailsList
            selectionMode={SelectionMode.none}
            layoutMode={DetailsListLayoutMode.fixedColumns}
            enableShimmer={state.loading}
            items={items}
            onRenderItemColumn={renderItemColumn}
            onColumnHeaderContextMenu={(col, ev) =>
              dispatch(
                COLUMN_HEADER_CONTEXT_MENU({
                  column: col,
                  target: ev.currentTarget
                })
              )
            }
            columns={[
              ...getDefaultColumns(ctxValue, props.isParent),
              ...state.columns,
              props.displayMode === DisplayMode.Edit && !props.lockedColumns && addColumn(dispatch)
            ].filter((c) => c)}
            groups={state.groups}
          />
        </div>
        <ColumnContextMenu />
        <ColumnFormPanel />
      </div>
    </PortfolioAggregationContext.Provider>
  )
}

export * from './types'
