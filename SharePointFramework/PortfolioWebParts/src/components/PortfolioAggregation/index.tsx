import { DisplayMode } from '@microsoft/sp-core-library'
import { DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList'
import { getId } from 'office-ui-fabric-react/lib/Utilities'
import strings from 'PortfolioWebPartsStrings'
import { UserMessage } from 'pzl-react-reusable-components/lib/UserMessage'
import React, { useEffect, useMemo, useReducer } from 'react'
import { FilterPanel } from '../FilterPanel'
import { ColumnContextMenu } from './ColumnContextMenu'
import { addColumn, ColumnFormPanel } from './ColumnFormPanel'
import { Commands } from './Commands'
import { PortfolioAggregationContext } from './context'
import { filterItems } from './filter'
import { getDefaultColumns, renderItemColumn } from './itemColumn'
import styles from './PortfolioAggregation.module.scss'
import createReducer, {
  COLUMN_HEADER_CONTEXT_MENU,
  DATA_FETCHED,
  DATA_FETCH_ERROR,
  GET_FILTERS,
  initState,
  ON_FILTER_CHANGE,
  START_FETCH,
  TOGGLE_FILTER_PANEL
} from './reducer'
import { searchItem } from './search'
import SearchBox from './SearchBox'
import { IPortfolioAggregationProps } from './types'
  
export const PortfolioAggregation = (props: IPortfolioAggregationProps) => {
  const reducer = useMemo(() => createReducer(props), [])
  const [state, dispatch] = useReducer(reducer, initState(props))
  const layerHostId = getId('layerHost')

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
  }, [props.dataSourceCategory, state.dataSource])

  useEffect(() => {
    dispatch(START_FETCH())
    props.dataAdapter.configure().then((adapter) => {
      Promise.all([
        adapter.dataSourceService.getByName(state.dataSource),
        adapter
          .fetchItemsWithSource(
            state.dataSource,
            props.selectProperties || state.columns.map((col) => col.fieldName),
            props.dataSourceCategory
          ),
        adapter.fetchProjects(props.configuration, state.dataSource)
      ])
        .then(([dataSrc, items, projects]) => {
          dispatch(DATA_FETCHED({ items, columns: dataSrc.projectColumns, projects }))
          dispatch(GET_FILTERS({ filters: dataSrc.projectRefiners }))
        })
        .catch((error) => dispatch(DATA_FETCH_ERROR({ error })))
    })
  }, [state.columnAdded, state.dataSource])

  const items = useMemo(() => {
    const filteredItems = filterItems(state.items, state.columns, state.activeFilters)
    return {
      listItems: filteredItems.items.filter((i) => searchItem(i, state.searchTerm, state.columns)),
      columns: filteredItems.columns
    }
  }, [state.searchTerm, state.items, state.activeFilters, state.columns])

  const ctxValue = useMemo(() => ({ props, state, dispatch }), [state])

  if (state.error) {
    return <UserMessage type={MessageBarType.error} text={state.error.message} />
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
            items={items.listItems}
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
              ...items.columns,
              props.displayMode === DisplayMode.Edit && !props.lockedColumns && addColumn(dispatch)
            ].filter((c) => c)}
            groups={state.groups}
            compact={state.isCompact}
          />
        </div>
        <ColumnContextMenu />
        <ColumnFormPanel />
        <FilterPanel
          isOpen={state.showFilterPanel}
          layerHostId={layerHostId}
          headerText={strings.FiltersString}
          onDismissed={() => dispatch(TOGGLE_FILTER_PANEL({ isOpen: false }))}
          isLightDismiss={true}
          filters={state.filters}
          onFilterChange={(column, selectedItems) => {
            dispatch(ON_FILTER_CHANGE({ column, selectedItems }))
          }}
        />
      </div>
    </PortfolioAggregationContext.Provider>


  )
}

export * from './types'
