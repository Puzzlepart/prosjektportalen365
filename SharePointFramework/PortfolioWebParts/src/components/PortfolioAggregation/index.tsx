import {
  MessageBarType,
  ShimmeredDetailsList,
  SelectionMode,
  DetailsListLayoutMode
} from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import React, { FC } from 'react'
import { FilterPanel } from '../FilterPanel'
import { ColumnContextMenu } from './ColumnContextMenu'
import { addColumn, ColumnFormPanel } from './ColumnFormPanel'
import { Commands } from './Commands'
import { PortfolioAggregationContext } from './context'
import { getDefaultColumns, renderItemColumn } from './itemColumn'
import styles from './PortfolioAggregation.module.scss'
import {
  COLUMN_HEADER_CONTEXT_MENU,
  ON_FILTER_CHANGE,
  SET_ALL_COLLAPSED,
  SET_COLLAPSED,
  TOGGLE_FILTER_PANEL
} from './reducer'
import SearchBox from './SearchBox'
import { ShowHideColumnPanel } from './ShowHideColumnPanel'
import { IPortfolioAggregationProps } from './types'
import { usePortfolioAggregation } from './usePortfolioAggregation'

export const PortfolioAggregation: FC<IPortfolioAggregationProps> = (props) => {
  const { state, dispatch, items, layerHostId, ctxValue } = usePortfolioAggregation(props)

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
            onColumnHeaderClick={(ev, col) => {
              dispatch(
                COLUMN_HEADER_CONTEXT_MENU({
                  column: col,
                  target: ev.currentTarget
                })
              )
            }}
            columns={[
              ...getDefaultColumns(props),
              ...items.columns,
              !props.lockedColumns && addColumn()
            ].filter((c) => c)}
            groups={state.groups}
            compact={state.isCompact}
            groupProps={{
              // TODO: Temporary fix for collapsing groups, the new state handling throws errors
              onToggleCollapseAll: (isAllCollapsed) =>
                dispatch(SET_ALL_COLLAPSED({ isAllCollapsed })),
              headerProps: {
                onToggleCollapse: (group) => dispatch(SET_COLLAPSED({ group }))
              }
            }}
          />
        </div>
        <ColumnContextMenu />
        <ColumnFormPanel />
        <ShowHideColumnPanel />
        <FilterPanel
          isOpen={state.showFilterPanel}
          layerHostId={layerHostId}
          headerText={strings.FiltersString}
          onDismiss={() => dispatch(TOGGLE_FILTER_PANEL({ isOpen: false }))}
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

PortfolioAggregation.defaultProps = {
  showCommandBar: true,
  showExcelExportButton: true,
  showSearchBox: true
}

export * from './types'
