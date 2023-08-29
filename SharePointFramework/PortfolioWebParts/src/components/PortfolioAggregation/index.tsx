import { WebPartContext } from '@microsoft/sp-webpart-base'
import React, { FC } from 'react'
import { EditViewColumnsPanel } from '../EditViewColumnsPanel'
import { List } from '../List'
import { ColumnContextMenu } from './ColumnContextMenu'
import { ColumnFormPanel } from './ColumnFormPanel'
import styles from './PortfolioAggregation.module.scss'
import { ViewFormPanel } from './ViewFormPanel'
import { PortfolioAggregationContext } from './context'
import { SET_ALL_COLLAPSED, SET_COLLAPSED } from './reducer'
import { IPortfolioAggregationProps } from './types'
import { usePortfolioAggregation } from './usePortfolioAggregation'

export const PortfolioAggregation: FC<IPortfolioAggregationProps> = (props) => {
  const {
    context,
    searchBox,
    editViewColumnsPanelProps,
    onColumnContextMenu,
    commandBarProps,
    filterPanelProps
  } = usePortfolioAggregation(props)

  return (
    <div className={styles.root}>
      <PortfolioAggregationContext.Provider value={context}>
        <div className={styles.container}>
          <List
            key={context.state.currentView?.id}
            title={props.title}
            enableShimmer={context.state.loading}
            items={context.items}
            columns={context.columns}
            groups={context.state.groups}
            searchBox={searchBox}
            onColumnContextMenu={onColumnContextMenu}
            isAddColumnEnabled={!props.lockedColumns && !props.isParentProject}
            compact={context.state.isCompact}
            isListLayoutModeJustified={props.isListLayoutModeJustified}
            groupProps={{
              onToggleCollapseAll: (isAllCollapsed) =>
                context.dispatch(SET_ALL_COLLAPSED({ isAllCollapsed })),
              headerProps: {
                onToggleCollapse: (group) => context.dispatch(SET_COLLAPSED({ group }))
              }
            }}
            webPartContext={props.spfxContext as WebPartContext}
            layerHostId={context.layerHostId}
            commandBarProps={commandBarProps}
            filterPanelProps={filterPanelProps}
            error={context.state.error}
          />
        </div>
        <ColumnContextMenu />
        <ColumnFormPanel />
        <EditViewColumnsPanel {...editViewColumnsPanelProps} />
        <ViewFormPanel />
      </PortfolioAggregationContext.Provider>
    </div>
  )
}

PortfolioAggregation.defaultProps = {
  showCommandBar: true,
  showExcelExportButton: true,
  lockedColumns: false
}

export * from './types'
