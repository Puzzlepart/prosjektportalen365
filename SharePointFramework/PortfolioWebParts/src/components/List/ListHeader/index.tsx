import { IDetailsHeaderProps, IRenderFunction, Sticky, StickyPositionType } from '@fluentui/react'
import { SearchBox } from '@fluentui/react/lib/SearchBox'
import React, { FC } from 'react'
import { IListProps } from '../types'
import styles from './ListHeader.module.scss'
import { IListHeaderProps } from './types'
import strings from 'PortfolioWebPartsStrings'

/**
 * Component for displaying a Sticky list header.
 */
export const ListHeader: FC<IListHeaderProps> = (props) => {
  /*  */
  return (
    <Sticky
      stickyClassName={styles.sticky}
      stickyPosition={StickyPositionType.Header}
      isScrollSynced={true}
    >
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
        </div>
        <div
          className={styles.searchBoxContainer}
          hidden={!props.searchBox || props?.searchBox?.hidden}
        >
          <SearchBox placeholder={strings.SearchBoxPlaceholderFallbackText} {...props.searchBox} />
        </div>
        {props.defaultRender && (
          <div className={styles.headerColumns}>{props.defaultRender(props.headerProps)}</div>
        )}
      </div>
    </Sticky>
  )
}

/**
 * A function that returns a render function for the list header.
 *
 * @param props List props
 */
export const onRenderDetailsHeader =
  (props: IListProps): IRenderFunction<IDetailsHeaderProps> =>
  (headerProps, defaultRender) =>
    <ListHeader {...props} headerProps={headerProps} defaultRender={defaultRender} />
