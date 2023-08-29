// import strings from 'PortfolioWebPartsStrings'
// import { ProjectContentColumn } from 'pp365-shared-library'
// import { FilterPanel } from 'pp365-shared-library/lib/components/FilterPanel'
import React, { FC } from 'react'
// import { EditViewColumnsPanel } from '../EditViewColumnsPanel'
// import { List } from '../List'
// import { ColumnContextMenu } from './ColumnContextMenu'
// import { ColumnFormPanel } from './ColumnFormPanel'
// import { Commands } from './Commands'
import styles from './PortfolioAggregation.module.scss'
// import { ViewFormPanel } from './ViewFormPanel'
import { PortfolioAggregationContext } from './context'
// import { ON_FILTER_CHANGE, SET_ALL_COLLAPSED, SET_COLLAPSED, TOGGLE_FILTER_PANEL } from './reducer'
import { IPortfolioAggregationProps } from './types'
import { usePortfolioAggregation } from './usePortfolioAggregation'
// import { WebPartContext } from '@microsoft/sp-webpart-base'

export const PortfolioAggregation: FC<IPortfolioAggregationProps> = (props) => {
  // const { context, searchBox, editViewColumnsPanelProps, onColumnContextMenu } =
  //   usePortfolioAggregation(props)
    const { context} =
    usePortfolioAggregation(props)

  return (
    <div className={styles.root}>
      <PortfolioAggregationContext.Provider value={context}>
        {/* <Commands />
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
            error={context.state.error}
          />
        </div>
        <ColumnContextMenu />
        <ColumnFormPanel />
        <EditViewColumnsPanel {...editViewColumnsPanelProps} />
        <ViewFormPanel />
        <FilterPanel
          isOpen={context.state.isFilterPanelOpen}
          layerHostId={context.layerHostId}
          headerText={strings.FiltersString}
          onDismiss={() => context.dispatch(TOGGLE_FILTER_PANEL({ isOpen: false }))}
          isLightDismiss={true}
          filters={context.state.filters}
          onFilterChange={(column: ProjectContentColumn, selectedItems) => {
            context.dispatch(ON_FILTER_CHANGE({ column, selectedItems }))
          }}
        /> */}
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
