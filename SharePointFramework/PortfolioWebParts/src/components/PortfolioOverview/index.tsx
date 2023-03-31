import { ConstrainMode, ContextualMenu, DetailsListLayoutMode, LayerHost, MarqueeSelection, MessageBar, ScrollablePane, ScrollbarVisibility, SelectionMode, ShimmeredDetailsList } from '@fluentui/react'
import { ProjectColumn } from 'pp365-shared/lib/models'
import React, { FC } from 'react'
import { PortfolioOverviewContext } from './context'
import styles from './PortfolioOverview.module.scss'
import { PortfolioOverviewCommands } from './PortfolioOverviewCommands'
import { renderItemColumn } from './RenderItemColumn'
import {
    IPortfolioOverviewProps
} from './types'
import { usePortfolioOverview } from './usePortfolioOverview'

export const PortfolioOverview: FC<IPortfolioOverviewProps> = (props) => {
    const {
        state,
        setState,
        layerHostId,
        selection,
        getFilteredData,
        getFilters,
        onRenderDetailsHeader,
        onColumnHeaderClick,
        onColumnHeaderContextMenu,
        onChangeView,
        onFilterChange
    } = usePortfolioOverview()

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

    const { items, columns, groups } = getFilteredData()

    return (
        <PortfolioOverviewContext.Provider value={{ props, state, layerHostId }}>
            <div className={styles.root}>
                <PortfolioOverviewCommands
                    // {...{ ...props, ...state }}
                    // fltItems={items}
                    // fltColumns={columns}
                    // filters={getFilters()}
                    // events={{
                    //     onSetCompact: (isCompact) => setState({ isCompact }),
                    //     onChangeView,
                    //     onFilterChange
                    // }}
                    // layerHostId={layerHostId}
                    // hidden={!props.showCommandBar}
                />
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
                                onRenderDetailsHeader={onRenderDetailsHeader}
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
            </div>
        </PortfolioOverviewContext.Provider>
    )
}

export * from './types'
