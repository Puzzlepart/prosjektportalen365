import {
  DetailsListLayoutMode,
  LayerHost,
  MarqueeSelection,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode
} from '@fluentui/react'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { EditViewColumnsPanel } from '../EditViewColumnsPanel'
import { List } from '../List'
import { ColumnContextMenu } from './ColumnContextMenu'
import { ColumnFormPanel } from './ColumnFormPanel'
import { Commands } from './Commands'
import { ListHeader, onRenderDetailsHeader } from './ListHeader'
import styles from './PortfolioOverview.module.scss'
import { ViewFormPanel } from './ViewFormPanel'
import { PortfolioOverviewContext } from './context'
import { IPortfolioOverviewProps } from './types'
import { usePortfolioOverview } from './usePortfolioOverview'

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
                <List
                  enableShimmer={state.loading || !!state.isChangingView}
                  items={items}
                  columns={columns}
                  groups={groups}
                  isAddColumnEnabled={!props.isParentProject}
                  selectionMode={SelectionMode.multiple}
                  selection={selection}
                  setKey='multiple'
                  onRenderDetailsHeader={onRenderDetailsHeader}
                  onColumnHeaderClick={(event, column) =>
                    onColumnHeaderContextMenu({ column, event })
                  }
                  onColumnHeaderContextMenu={(column, event) =>
                    onColumnHeaderContextMenu({ column, event })
                  }
                  compact={state.isCompact}
                  layoutMode={
                    props.listLayoutModeJustified
                      ? DetailsListLayoutMode.justified
                      : DetailsListLayoutMode.fixedColumns
                  }
                  renderTitleProjectInformationPanel={true}
                  webPartContext={props.webPartContext}
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
  IPortfolioOverviewConfiguration,
  IPortfolioOverviewProps,
  IPortfolioOverviewState
} from './types'
