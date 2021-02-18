import { DisplayMode } from '@microsoft/sp-core-library'
import { DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox'
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList'
import React, { useEffect, useMemo, useReducer } from 'react'
import { ColumnContextMenu } from './ColumnContextMenu'
import { addColumn, ColumnFormPanel } from './ColumnFormPanel'
import { Commands } from './Commands'
import { PortfolioAggregationContext } from './context'
import { renderItemColumn, siteTitleColumn } from './itemColumn'
import styles from './PortfolioAggregation.module.scss'
import createReducer, {
  COLUMN_HEADER_CONTEXT_MENU,
  DATA_FETCHED,
  initState,
  SEARCH,
  START_FETCH
} from './reducer'
import { filterItem } from './search'
import { IPortfolioAggregationProps } from './types'

export const PortfolioAggregation = (props: IPortfolioAggregationProps) => {
  const reducer = useMemo(() => createReducer(props), [])
  const [state, dispatch] = useReducer(reducer, initState(props))

  useEffect(() => {
    if (props.dataSourceCategory) {
      props.dataAdapter
        .fetchDataSources(props.dataSourceCategory)
        .then((dataSources) => dispatch(DATA_FETCHED({ items: null, dataSources })))
    }
  }, [props.dataSourceCategory])

  useEffect(() => {
    dispatch(START_FETCH())
    props.dataAdapter
      .fetchItemsWithSource(
        state.dataSource,
        props.selectProperties || state.columns.map((col) => col.fieldName)
      )
      .then((items) => dispatch(DATA_FETCHED({ items })))
  }, [state.columnAdded, state.dataSource])

  const items = useMemo(() => {
    return state.items.filter((i) => filterItem(i, state.searchTerm, state.columns))
  }, [state.searchTerm, state.items])

  return (
    <PortfolioAggregationContext.Provider value={{ props, state, dispatch }}>
      <div className={styles.root}>
        <Commands />
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
        </div>
        <div className={styles.searchBox} hidden={!props.showSearchBox}>
          <SearchBox
            placeholder={props.searchBoxPlaceholderText}
            onChange={(searchTerm) => dispatch(SEARCH({ searchTerm }))}
          />
        </div>
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
              siteTitleColumn,
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
