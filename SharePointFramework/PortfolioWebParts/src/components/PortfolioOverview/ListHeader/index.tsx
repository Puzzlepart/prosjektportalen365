import {
  format,
  IDetailsHeaderProps,
  IRenderFunction,
  Sticky,
  StickyPositionType
} from '@fluentui/react'
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

  /**
   * Get the placeholder text for the search box based on the
   * current view. If no view is selected, use a fallback text
   * `strings.SearchBoxPlaceholderFallbackText`.
   *
   * @returns The placeholder text for the search box.
   */
  const getSearchBoxPlaceholderText = () => {
    if (!context.state.currentView) return strings.SearchBoxPlaceholderFallbackText
    return format(strings.SearchBoxPlaceholderText, context.state.currentView.title.toLowerCase())
  }

  return (
    <Sticky
      stickyClassName={styles.sticky}
      stickyPosition={StickyPositionType.Header}
      isScrollSynced={true}
    >
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.title}>{context.props.title}</div>
        </div>
        <div className={styles.searchBox} hidden={!context.props.showSearchBox}>
          <SearchBox
            disabled={context.state.loading || !!context.state.error}
            onChange={(_e, newValue) => context.dispatch(EXECUTE_SEARCH(newValue))}
            placeholder={getSearchBoxPlaceholderText()}
          />
        </div>
        {props.defaultRender && (
          <div className={styles.headerColumns}>{props.defaultRender(props.headerProps)}</div>
        )}
      </div>
    </Sticky>
  )
}

/**
 * Render function for `ListHeader`.
 *
 * @param headerProps Header props
 * @param defaultRender Default render function
 */
export const onRenderDetailsHeader: IRenderFunction<IDetailsHeaderProps> = (
  headerProps,
  defaultRender
) => {
  return <ListHeader headerProps={headerProps} defaultRender={defaultRender} />
}
