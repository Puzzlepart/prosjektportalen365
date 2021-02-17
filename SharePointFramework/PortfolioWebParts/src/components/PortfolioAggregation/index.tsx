import { DisplayMode } from '@microsoft/sp-core-library'
import { DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox'
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList'
import strings from 'PortfolioWebPartsStrings'
import React, { useEffect, useMemo, useReducer } from 'react'
import { addColumn, ColumnFormPanel } from './ColumnFormPanel'
import { ColumnContextMenu } from './ColumnContextMenu'
import { Commands } from './Commands'
import { PortfolioAggregationContext } from './context'
import styles from './PortfolioAggregation.module.scss'
import createReducer, { COLUMN_HEADER_CONTEXT_MENU, DATA_FETCHED, initState, SEARCH, START_FETCH } from './reducer'
import { IPortfolioAggregationProps } from './types'
import { formatDate } from 'pp365-shared/lib/helpers'

export const PortfolioAggregation = (props: IPortfolioAggregationProps) => {
  const reducer = useMemo(() => createReducer(props), [])
  const [state, dispatch] = useReducer(reducer, initState(props))
  const selectProperties = useMemo(() => state.columns.map(col => col.fieldName).sort(), [state.columns])

  useEffect(() => {
    if (props.dataSourceCategory) {
      props.dataAdapter.fetchDataSources(props.dataSourceCategory)
        .then(dataSources => dispatch(DATA_FETCHED({ items: null, dataSources })))
    }
  }, [props.dataSourceCategory])

  useEffect(() => {
    dispatch(START_FETCH())
    props.dataAdapter.fetchItemsWithSource(
      state.dataSource,
      selectProperties
    ).then(items => dispatch(DATA_FETCHED({ items })))
  }, [selectProperties, state.dataSource])

  const items = useMemo(() =>
    state.items.filter(i => JSON.stringify(i).toLowerCase().indexOf(state.searchTerm.toLowerCase()) !== -1),
    [state.searchTerm, state.items]
  )

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
            onChange={(searchTerm) => dispatch(SEARCH({ searchTerm }))} />
        </div>
        <div className={styles.listContainer}>
          <ShimmeredDetailsList
            selectionMode={SelectionMode.none}
            layoutMode={DetailsListLayoutMode.fixedColumns}
            enableShimmer={state.loading}
            items={items}
            onRenderItemColumn={(item, _i, column) => {
              const value = item[column.fieldName]
              switch (column?.data?.renderAs) {
                case 'date': return formatDate(value, false)
                case 'datetime': return formatDate(value, true)
                default: return value
              }
            }}
            onColumnHeaderContextMenu={(col, ev) => dispatch(
              COLUMN_HEADER_CONTEXT_MENU({
                column: col,
                target: ev.currentTarget
              })
            )}
            columns={[
              {
                key: 'SiteTitle',
                fieldName: 'SiteTitle',
                name: strings.SiteTitleLabel,
                minWidth: 100,
                maxWidth: 150,
                isResizable: true,
                onRender: (item: any) => (
                  <a href={item.SPWebUrl} rel='noopener noreferrer' target='_blank'>
                    {item.SiteTitle}
                  </a>
                ),
                data: { isGroupable: true }
              },
              ...state.columns,
              props.displayMode === DisplayMode.Edit && addColumn(dispatch)
            ].filter(c => c)}
            groups={state.groups} />
        </div>
        <ColumnContextMenu />
        <ColumnFormPanel />
      </div>
    </PortfolioAggregationContext.Provider>
  )
}

export * from './types'
