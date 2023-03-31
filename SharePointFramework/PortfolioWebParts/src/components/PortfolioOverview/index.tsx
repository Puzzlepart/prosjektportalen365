import { ConstrainMode, ContextualMenu, DetailsListLayoutMode, IDetailsHeaderProps, IRenderFunction, LayerHost, MarqueeSelection, MessageBar, ScrollablePane, ScrollbarVisibility, SearchBox, SelectionMode, ShimmeredDetailsList, Sticky, StickyPositionType } from '@fluentui/react'
import { ProjectColumn } from 'pp365-shared/lib/models'
import React, { FC } from 'react'
import { PortfolioOverviewContext } from './context'
import styles from './PortfolioOverview.module.scss'
import { PortfolioOverviewCommands } from './PortfolioOverviewCommands'
import { renderItemColumn } from './RenderItemColumn'
import {
    IPortfolioOverviewProps
} from './types'
import { useFilteredData } from './useFilteredData'
import { usePortfolioOverview } from './usePortfolioOverview'

/**
 * Component for displaying a portfolio overview - an overview of all projects in a portfolio.
 */
export const PortfolioOverview: FC<IPortfolioOverviewProps> = (props) => {
    const {
        state,
        layerHostId,
        selection,
        onColumnHeaderClick,
        onColumnHeaderContextMenu,
    } = usePortfolioOverview(props)
    const { items, columns, groups } = useFilteredData(props, state)

    if (state.error) {
        return (
            <div className={styles.root}>
                <div className={styles.container}>
                    <MessageBar messageBarType={state.error.type}>
                        {state.error.message}
                    </MessageBar>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.root}>
            <PortfolioOverviewContext.Provider value={{ props, state, layerHostId }}>
                <PortfolioOverviewCommands />
                <div className={styles.container}>
                    <ScrollablePane
                        scrollbarVisibility={ScrollbarVisibility.auto}
                        styles={{ root: { top: 75 } }}>
                        <MarqueeSelection selection={selection} className={styles.listContainer}>
                            <ShimmeredDetailsList
                                enableShimmer={state.loading || !!state.isChangingView}
                                items={items}
                                constrainMode={ConstrainMode.unconstrained}
                                layoutMode={DetailsListLayoutMode.fixedColumns}
                                columns={columns}
                                groups={groups}
                                selectionMode={SelectionMode.multiple}
                                selection={selection}
                                setKey='multiple'
                                onRenderDetailsHeader={(headerProps: IDetailsHeaderProps, defaultRender?: IRenderFunction<IDetailsHeaderProps>) => (
                                    <Sticky
                                        stickyClassName={styles.stickyHeader}
                                        stickyPosition={StickyPositionType.Header}
                                        isScrollSynced={true}>
                                        <div className={styles.header}>
                                            <div className={styles.title}>{props.title}</div>
                                        </div>
                                        <div className={styles.searchBox} hidden={!props.showSearchBox}>
                                            <SearchBox
                                                // onChange={this._onSearch.bind(this)}
                                                placeholder={''}
                                            />
                                        </div>
                                        <div className={styles.headerColumns}>{defaultRender(headerProps)}</div>
                                    </Sticky>
                                )}
                                onRenderItemColumn={(item, _index, column: ProjectColumn) =>
                                    renderItemColumn(item, column, props)
                                }
                                onColumnHeaderClick={onColumnHeaderClick}
                                onColumnHeaderContextMenu={onColumnHeaderContextMenu}
                                compact={state.isCompact}
                            />
                        </MarqueeSelection>
                        <LayerHost id={layerHostId} />
                    </ScrollablePane>
                </div>
                {state.columnContextMenu && <ContextualMenu {...state.columnContextMenu} />}
            </PortfolioOverviewContext.Provider>
        </div>
    )
}

export * from './types'
