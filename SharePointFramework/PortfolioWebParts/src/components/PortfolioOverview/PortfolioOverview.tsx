import { Toaster } from '@fluentui/react-components'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { Fluent, UserMessage, format, withDefaults } from 'pp365-shared-library'
import { EditViewColumnsPanel } from '../EditViewColumnsPanel'
import React, { FC } from 'react'
import { List } from '../List'
import { ColumnContextMenu } from './ColumnContextMenu'
import { ColumnFormPanel } from './ColumnFormPanel'
import styles from './PortfolioOverview.module.scss'
import { ViewFormPanel } from './ViewFormPanel'
import { PortfolioOverviewContext } from './context'
import { IPortfolioOverviewProps } from './types'
import { usePortfolioOverview } from './hooks/usePortfolioOverview'
import resource from 'SharedResources'
import strings from 'PortfolioWebPartsStrings'

const PORTFOLIO_OVERVIEW_DEFAULT_PROPS: Partial<IPortfolioOverviewProps> = {
  title: resource.WebParts_PortfolioOverview_Title,
  portfolios: [],
  statusReportsCount: 0,
  showCommandBar: true,
  showExcelExportButton: true,
  showViewSelector: true,
  showSearchBox: true,
  showFilters: true,
  showMergedViewInViewSelector: false
}

export const PortfolioOverview: FC<IPortfolioOverviewProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, PORTFOLIO_OVERVIEW_DEFAULT_PROPS)
  const {
    context,
    onSelectionChange,
    onColumnContextMenu,
    editViewColumnsPanelProps,
    searchBox,
    menuItems,
    filterPanelProps
  } = usePortfolioOverview(props)

  return (
    <div className={styles.portfolioOverview}>
      <PortfolioOverviewContext.Provider value={context}>
        <div className={styles.container}>
          {/* A hub the merged view could not read is told, not left out in silence (WCAG 3.3.1). */}
          {(context.state.mergedViewFailures?.length ?? 0) > 0 && (
            <UserMessage
              intent='warning'
              title={strings.MergedViewHubFailedTitle}
              text={format(
                strings.MergedViewHubFailedText,
                context.state.mergedViewFailures.join(', ')
              )}
            />
          )}
          <List
            title={props.title}
            enableShimmer={context.state.loading || context.state.isChangingView}
            items={context.items}
            columns={context.state.columns}
            groups={context.groups}
            searchBox={searchBox}
            onSelectionChange={onSelectionChange}
            onColumnContextMenu={onColumnContextMenu}
            compact={context.state.isCompact}
            isListLayoutModeJustified={props.isListLayoutModeJustified}
            webPartContext={props.spfxContext as WebPartContext}
            menuItems={menuItems}
            filterPanelProps={filterPanelProps}
            error={context.state.error}
            renderTitleProjectInformationPanel
          />
        </div>
        <ColumnContextMenu />
        <ColumnFormPanel />
        <EditViewColumnsPanel {...editViewColumnsPanelProps} />
        <ViewFormPanel />
        <Fluent>
          <Toaster toasterId={context.toasterId} />
        </Fluent>
      </PortfolioOverviewContext.Provider>
    </div>
  )
}

PortfolioOverview.displayName = 'PortfolioOverview'
