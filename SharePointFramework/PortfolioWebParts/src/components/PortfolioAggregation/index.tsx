import { DisplayMode } from '@microsoft/sp-core-library'
import { DetailsListLayoutMode, IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList'
import React, { useEffect, useState } from 'react'
import { addColumn, AddColumnPanel } from './AddColumnPanel'
import styles from './PortfolioAggregation.module.scss'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'

export const PortfolioAggregation = (props: IPortfolioAggregationProps) => {
  const [state, setState] = useState<IPortfolioAggregationState>({
    loading: true,
    items: [],
    columns: props.columns,
  })


  useEffect(() => {
    props.dataAdapter.fetchItemsWithSource(
      props.dataSource,
      state.columns.map(col => col.fieldName)
    )
      .then(items =>
        setState({ ...state, items, loading: false })
      )
  }, [state.columns])

  /**
   * On add column
   * 
   * @param {IColumn} column Column to add
   */
  const onAddColumn = (column: IColumn) => {
    const _columns = [...state.columns, column]
    setState({ ...state, columns: _columns })
    props.onUpdateProperty('columns', _columns)
  }

  return (
    <div className={styles.root}>
      <ShimmeredDetailsList
        layoutMode={DetailsListLayoutMode.fixedColumns}
        enableShimmer={state.loading}
        items={state.items}
        columns={[
          ...state.columns,
          props.displayMode === DisplayMode.Edit && addColumn(() => setState({
            ...state,
            addColumn: true
          }))
        ].filter(c => c)} />
      <AddColumnPanel
        isOpen={state.addColumn}
        onAddColumn={onAddColumn}
        onDismiss={() => setState({
          ...state,
          addColumn: false
        })} />
    </div>
  )
}

export * from './types'
