import { MessageBarType } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectContentColumn } from 'pp365-shared-library'
import { FilterPanel } from 'pp365-shared-library/lib/components/FilterPanel'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { EditViewColumnsPanel } from '../EditViewColumnsPanel'
import { List } from '../List'
import { ColumnContextMenu } from './ColumnContextMenu'
import { ColumnFormPanel } from './ColumnFormPanel'
import { Commands } from './Commands'
import styles from './PortfolioAggregation.module.scss'
import { PortfolioAggregationContext } from './context'
import { ON_FILTER_CHANGE, SET_ALL_COLLAPSED, SET_COLLAPSED, TOGGLE_FILTER_PANEL } from './reducer'
import { IPortfolioAggregationProps } from './types'
import { usePortfolioAggregation } from './usePortfolioAggregation'

export const PortfolioAggregation: FC<IPortfolioAggregationProps> = (props) => {
  const { context, searchBox, editViewColumnsPanelProps, onColumnContextMenu } =
    usePortfolioAggregation(props)

  if (context.state.error) {
    return (
      <div className={styles.root}>
        <div className={styles.container}>
          <UserMessage type={MessageBarType.error} text={context.state.error.message} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <PortfolioAggregationContext.Provider value={context}>
        <Commands />
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
              // TODO: Temporary fix for collapsing groups, the new state handling throws errors
              onToggleCollapseAll: (isAllCollapsed) =>
                context.dispatch(SET_ALL_COLLAPSED({ isAllCollapsed })),
              headerProps: {
                onToggleCollapse: (group) => context.dispatch(SET_COLLAPSED({ group }))
              }
            }}
            webPartContext={props.webPartContext}
            layerHostId={context.layerHostId}
          />
        </div>
        <ColumnContextMenu />
        <ColumnFormPanel />
        <EditViewColumnsPanel {...editViewColumnsPanelProps} />
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
        />
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
