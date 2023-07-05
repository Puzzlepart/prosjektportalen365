import {
  ConstrainMode,
  DetailsListLayoutMode,
  LayerHost,
  MarqueeSelection,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { ColumnContextMenu } from './ColumnContextMenu'
import { ColumnFormPanel } from './ColumnFormPanel'
import { ListHeader, onRenderDetailsHeader } from './ListHeader'
import styles from './PortfolioOverview.module.scss'
import { Commands } from './Commands'
import { onRenderItemColumn } from './RenderItemColumn'
import { PortfolioOverviewContext } from './context'
import { IPortfolioOverviewProps, addColumn } from './types'
import { usePortfolioOverview } from './usePortfolioOverview'
import { EditViewColumnsPanel } from '../EditViewColumnsPanel'
import { ViewFormPanel } from './ViewFormPanel'

/**
 * Component for displaying a portfolio overview - an overview of all projects in a portfolio.
 */
export const PortfolioOverview: FC<IPortfolioOverviewProps> = (props) => {
  const {
    state,
    contextValue,
    selection,
    onColumnHeaderContextMenu,
    editViewColumnsPanelProps,
    items,
    columns,
    groups
  } = usePortfolioOverview(props)

  return (
    <div className={styles.root}>
      <PortfolioOverviewContext.Provider value={contextValue}>
        <Commands
          filteredData={{
            items,
            columns,
            groups
          }}
        />
        <div className={styles.container}>
          {state.error ? (
            <div className={styles.errorContainer}>
              <ListHeader />
              <div className={styles.error}>
                <UserMessage text={state.error.message} type={state.error.type} />
              </div>
            </div>
          ) : (
            <ScrollablePane
              scrollbarVisibility={ScrollbarVisibility.auto}
              styles={{ root: { top: 75 } }}
            >
              <MarqueeSelection selection={selection}>
                <ShimmeredDetailsList
                  enableShimmer={state.loading || !!state.isChangingView}
                  isPlaceholderData={state.loading || !!state.isChangingView}
                  items={items}
                  constrainMode={ConstrainMode.unconstrained}
                  layoutMode={DetailsListLayoutMode.fixedColumns}
                  columns={[...columns, !props.isParentProject && addColumn].filter(Boolean)}
                  groups={groups}
                  selectionMode={SelectionMode.multiple}
                  selection={selection}
                  setKey='multiple'
                  onRenderDetailsHeader={onRenderDetailsHeader}
                  onRenderItemColumn={onRenderItemColumn(props)}
                  onColumnHeaderClick={(event, column) =>
                    onColumnHeaderContextMenu({ column, event })
                  }
                  onColumnHeaderContextMenu={(column, event) =>
                    onColumnHeaderContextMenu({ column, event })
                  }
                  compact={state.isCompact}
                />
              </MarqueeSelection>
              <LayerHost id={contextValue.layerHostId} />
            </ScrollablePane>
          )}
        </div>
        <ColumnContextMenu />
        <ColumnFormPanel />
        <EditViewColumnsPanel {...editViewColumnsPanelProps} />
        <ViewFormPanel />
      </PortfolioOverviewContext.Provider>
    </div>
  )
}

export {
  IPortfolioOverviewProps,
  IPortfolioOverviewState,
  IPortfolioOverviewConfiguration
} from './types'
