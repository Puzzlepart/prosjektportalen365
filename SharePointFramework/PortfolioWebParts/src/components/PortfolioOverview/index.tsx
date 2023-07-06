import { DetailsListLayoutMode } from '@fluentui/react'
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
import { EXECUTE_SEARCH } from './reducer'

/**
 * Component for displaying a portfolio overview - an overview of all projects in a portfolio.
 */
export const PortfolioOverview: FC<IPortfolioOverviewProps> = (props) => {
  const { context, selection, onColumnHeaderContextMenu, editViewColumnsPanelProps } =
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
            columns={context.columns}
            groups={context.groups}
            searchBox={{
              onChange: (_, searchTerm) => context.dispatch(EXECUTE_SEARCH(searchTerm))
            }}
            isAddColumnEnabled={!props.isParentProject}
            selection={selection}
            setKey='multiple'
            onColumnHeaderClick={(event, column) => onColumnHeaderContextMenu({ column, event })}
            onColumnHeaderContextMenu={(column, event) =>
              onColumnHeaderContextMenu({ column, event })
            }
            compact={context.state.isCompact}
            layoutMode={
              props.listLayoutModeJustified
                ? DetailsListLayoutMode.justified
                : DetailsListLayoutMode.fixedColumns
            }
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
