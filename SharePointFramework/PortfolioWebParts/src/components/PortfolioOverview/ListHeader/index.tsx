import { format, Sticky, StickyPositionType } from '@fluentui/react'
import { SearchBox } from '@fluentui/react/lib/SearchBox'
import strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import { EXECUTE_SEARCH } from '../reducer'
import styles from './ListHeader.module.scss'
import { IListHeaderProps } from './types'

/**
 * Component for displaying a Sticky list header.
 */
export const ListHeader: FC<IListHeaderProps> = (props) => {
    const context = useContext(PortfolioOverviewContext)

    const getSearchBoxPlaceholderText = () => {
        if (!context.state.currentView) return ''
        return format(strings.SearchBoxPlaceholderText, context.state.currentView.title.toLowerCase())
    }

    return (
        <Sticky
            stickyClassName={styles.sticky}
            stickyPosition={StickyPositionType.Header}
            isScrollSynced={true}>
            <div className={styles.root}>
                <div className={styles.header}>
                    <div className={styles.title}>{context.props.title}</div>
                </div>
                <div className={styles.searchBox} hidden={!context.props.showSearchBox}>
                    <SearchBox
                        onChange={(_e, newValue) => context.dispatch(EXECUTE_SEARCH(newValue))}
                        placeholder={getSearchBoxPlaceholderText()}
                    />
                </div>
                <div className={styles.headerColumns}>{props.defaultRender(props.headerProps)}</div>
            </div>
        </Sticky>
    )
}