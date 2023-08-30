import { WebPartContext } from '@microsoft/sp-webpart-base'
import React, { FC } from 'react'
import { EditViewColumnsPanel } from '../EditViewColumnsPanel'
import { List } from '../List'
import { ColumnContextMenu } from './ColumnContextMenu'
import { ColumnFormPanel } from './ColumnFormPanel'
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
    context,
    selection,
    onColumnContextMenu,
    editViewColumnsPanelProps,
    searchBox,
    menuItems,
    filterPanelProps
  } = usePortfolioOverview(props)

  return (
    <div className={styles.root}>
      <PortfolioOverviewContext.Provider value={context}>
        <div className={styles.container}>
          <List
            title={props.title}
            enableShimmer={context.state.loading || !!context.state.isChangingView}
            items={context.items}
            columns={context.state.columns}
            groups={context.groups}
            searchBox={searchBox}
            isAddColumnEnabled={!props.isParentProject}
            selection={selection}
            setKey='multiple'
            onColumnContextMenu={onColumnContextMenu}
            compact={context.state.isCompact}
            isListLayoutModeJustified={props.isListLayoutModeJustified}
            renderTitleProjectInformationPanel={true}
            webPartContext={props.spfxContext as WebPartContext}
            layerHostId={context.layerHostId}
            menuItems={menuItems}
            filterPanelProps={filterPanelProps}
            error={context.state.error}
          />
        </div>
        <ColumnContextMenu />
        <ColumnFormPanel />
        <EditViewColumnsPanel {...editViewColumnsPanelProps} />
        <ViewFormPanel />
      </PortfolioOverviewContext.Provider>
    </div>
  )
}

export * from './types'
