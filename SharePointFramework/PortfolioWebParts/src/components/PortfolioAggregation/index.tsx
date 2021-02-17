import { DisplayMode } from '@microsoft/sp-core-library'
import { DetailsListLayoutMode } from 'office-ui-fabric-react/lib/DetailsList'
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox'
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList'
import React, { useEffect, useMemo, useReducer } from 'react'
import { addColumn, AddColumnPanel } from './AddColumnPanel'
import { Commands } from './Commands'
import { PortfolioAggregationContext } from './context'
import styles from './PortfolioAggregation.module.scss'
import createReducer, { DATA_FETCHED, initState } from './reducer'
import { IPortfolioAggregationProps } from './types'

export const PortfolioAggregation = (props: IPortfolioAggregationProps) => {
  const reducer = useMemo(() => createReducer(props), [])
  const [state, dispatch] = useReducer(reducer, initState(props))

  useEffect(() => {
    props.dataAdapter.fetchItemsWithSource(
      props.dataSource,
      state.columns.map(col => col.fieldName)
    )
      .then(items => dispatch(DATA_FETCHED({ items })))
  }, [state.columns])

  return (
    <PortfolioAggregationContext.Provider value={{ props, state, dispatch }}>
      <div className={styles.root}>
        <Commands />
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
        </div>
        <div className={styles.searchBox} hidden={!props.showSearchBox}>
          <SearchBox />
        </div>
        <div className={styles.listContainer}>
          <ShimmeredDetailsList
            layoutMode={DetailsListLayoutMode.fixedColumns}
            enableShimmer={state.loading}
            items={state.items}
            columns={[
              ...state.columns,
              props.displayMode === DisplayMode.Edit && addColumn(dispatch)
            ].filter(c => c)} />
        </div>
        <AddColumnPanel />
      </div>
    </PortfolioAggregationContext.Provider>
  )
}

export * from './types'
