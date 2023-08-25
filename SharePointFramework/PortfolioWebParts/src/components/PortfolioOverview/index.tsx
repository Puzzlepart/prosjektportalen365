import React, { FC } from 'react'
import { EditViewColumnsPanel } from '../EditViewColumnsPanel'
import { List } from '../List'
import { ColumnContextMenu } from './ColumnContextMenu'
import { ColumnFormPanel } from './ColumnFormPanel'
import { Commands } from './Commands'
import styles from './PortfolioOverview.module.scss'
import { ViewFormPanel } from './ViewFormPanel'
import { PortfolioOverviewContext } from './context'
import { IPortfolioOverviewProps } from './types'
import { usePortfolioOverview } from './usePortfolioOverview'
import { WebPartContext } from '@microsoft/sp-webpart-base'

/**
 * Component for displaying a portfolio overview - an overview of all projects in a portfolio.
 */
export const PortfolioOverview: FC<IPortfolioOverviewProps> = (props) => {
  const { context, selection, onColumnContextMenu, editViewColumnsPanelProps, searchBoxProps } =
    usePortfolioOverview(props)

  return (
    <div className={styles.root}>
      <PortfolioOverviewContext.Provider value={context}>
        <Commands />
        <div className={styles.container}>
          <List
            title={props.title}
            enableShimmer={context.state.loading || !!context.state.isChangingView}
            items={context.items}
            columns={context.state.columns}
            groups={context.groups}
            searchBox={searchBoxProps}
            isAddColumnEnabled={!props.isParentProject}
            selection={selection}
            setKey='multiple'
            onColumnContextMenu={onColumnContextMenu}
            compact={context.state.isCompact}
            isListLayoutModeJustified={props.isListLayoutModeJustified}
            renderTitleProjectInformationPanel={true}
            webPartContext={props.spfxContext as WebPartContext}
            layerHostId={context.layerHostId}
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

export {
  IPortfolioOverviewConfiguration,
  IPortfolioOverviewProps,
  IPortfolioOverviewState
} from './types'
