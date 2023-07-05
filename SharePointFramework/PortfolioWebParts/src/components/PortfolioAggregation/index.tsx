import { MessageBarType } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { FilterPanel } from 'pp365-shared-library/lib/components/FilterPanel'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { EditViewColumnsPanel } from '../EditViewColumnsPanel'
import { List } from '../List'
import { ColumnContextMenu } from './ColumnContextMenu'
import { ColumnFormPanel } from './ColumnFormPanel'
import { Commands } from './Commands'
import styles from './PortfolioAggregation.module.scss'
import SearchBox from './SearchBox'
import { PortfolioAggregationContext } from './context'
import { getDefaultColumns } from './getDefaultColumns'
import {
  COLUMN_HEADER_CONTEXT_MENU,
  ON_FILTER_CHANGE,
  SET_ALL_COLLAPSED,
  SET_COLLAPSED,
  TOGGLE_FILTER_PANEL
} from './reducer'
import { IPortfolioAggregationProps } from './types'
import { usePortfolioAggregation } from './usePortfolioAggregation'

export const PortfolioAggregation: FC<IPortfolioAggregationProps> = (props) => {
  const { state, dispatch, items, layerHostId, context, editViewColumnsPanelProps } =
    usePortfolioAggregation(props)

  if (state.error) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
        </div>
        <div className={styles.container}>
          <UserMessage type={MessageBarType.error} text={state.error.message} />
        </div>
      </div>
    )
  }

  return (
    <PortfolioAggregationContext.Provider value={context}>
      <div className={styles.root}>
        <Commands />
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
        </div>
        <SearchBox />
        <div className={styles.container}>
          <List
            enableShimmer={state.loading}
            items={items.listItems}
            onColumnHeaderClick={(ev, col) => {
              dispatch(
                COLUMN_HEADER_CONTEXT_MENU({
                  column: col,
                  target: ev.currentTarget
                })
              )
            }}
            columns={[...getDefaultColumns(props), ...items.columns]}
            isAddColumnEnabled={!props.lockedColumns && !props.isParentProject}
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
        <EditViewColumnsPanel {...editViewColumnsPanelProps} />
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
