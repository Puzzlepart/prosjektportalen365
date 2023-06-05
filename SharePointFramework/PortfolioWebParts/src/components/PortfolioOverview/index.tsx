import {
  ConstrainMode,
  ContextualMenu,
  DetailsListLayoutMode,
  IDetailsHeaderProps,
  IRenderFunction,
  LayerHost,
  MarqueeSelection,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import { ProjectColumn } from 'pp365-shared-library/lib/models'
import React, { FC } from 'react'
import { PortfolioOverviewContext } from './context'
import { ListHeader } from './ListHeader'
import styles from './PortfolioOverview.module.scss'
import { PortfolioOverviewCommands } from './PortfolioOverviewCommands'
import { renderItemColumn } from './RenderItemColumn'
import { IPortfolioOverviewProps } from './types'
import { useFilteredData } from './useFilteredData'
import { usePortfolioOverview } from './usePortfolioOverview'

/**
 * Component for displaying a portfolio overview - an overview of all projects in a portfolio.
 */
export const PortfolioOverview: FC<IPortfolioOverviewProps> = (props) => {
  const {
    state,
    contextValue,
    selection,
    onColumnHeaderClick,
    onColumnHeaderContextMenu
  } = usePortfolioOverview(props)
  const { items, columns, groups } = useFilteredData(props, state)

  return (
    <div className={styles.root}>
      <PortfolioOverviewContext.Provider value={contextValue}>
        <PortfolioOverviewCommands
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
              styles={{ root: { top: 75 } }}>
              <MarqueeSelection selection={selection} className={styles.listContainer}>
                <ShimmeredDetailsList
                  enableShimmer={state.loading || !!state.isChangingView}
                  isPlaceholderData={state.loading || !!state.isChangingView}
                  items={items}
                  constrainMode={ConstrainMode.unconstrained}
                  layoutMode={DetailsListLayoutMode.fixedColumns}
                  columns={columns}
                  groups={groups}
                  selectionMode={SelectionMode.multiple}
                  selection={selection}
                  setKey='multiple'
                  onRenderDetailsHeader={(
                    headerProps: IDetailsHeaderProps,
                    defaultRender?: IRenderFunction<IDetailsHeaderProps>
                  ) => <ListHeader headerProps={headerProps} defaultRender={defaultRender} />}
                  onRenderItemColumn={(item, _index, column: ProjectColumn) =>
                    renderItemColumn(item, column, props)
                  }
                  onColumnHeaderClick={onColumnHeaderClick}
                  onColumnHeaderContextMenu={onColumnHeaderContextMenu}
                  compact={state.isCompact}
                />
              </MarqueeSelection>
              <LayerHost id={contextValue.layerHostId} />
            </ScrollablePane>
          )}
        </div>
        {state.columnContextMenu && <ContextualMenu {...state.columnContextMenu} />}
      </PortfolioOverviewContext.Provider>
    </div>
  )
}

export * from './types'
