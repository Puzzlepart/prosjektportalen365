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
import { UserMessage } from 'pp365-shared-library'
import { MessageBarType } from '@fluentui/react'

/**
 * Component for displaying a portfolio overview - an overview of all projects in a portfolio.
 */
export const PortfolioOverview: FC<IPortfolioOverviewProps> = (props) => {
  const { context, selection, onColumnContextMenu, editViewColumnsPanelProps, searchBox } =
    usePortfolioOverview(props)

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
      <PortfolioOverviewContext.Provider value={context}>
        <Commands />
        <div className={styles.container}>
          <List
            title={props.title}
            enableShimmer={context.state.loading || !!context.state.isChangingView}
            items={context.items}
            columns={context.columns}
            groups={context.groups}
            searchBox={searchBox}
            isAddColumnEnabled={!props.isParentProject}
            selection={selection}
            setKey='multiple'
            onColumnContextMenu={onColumnContextMenu}
            compact={context.state.isCompact}
            isListLayoutModeJustified={props.isListLayoutModeJustified}
            renderTitleProjectInformationPanel={true}
            webPartContext={props.webPartContext}
            layerHostId={context.layerHostId}
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
