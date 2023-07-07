import { IDetailsHeaderProps, IRenderFunction, MessageBarType, Sticky, StickyPositionType } from '@fluentui/react'
import { SearchBox } from '@fluentui/react/lib/SearchBox'
import React, { FC, useMemo } from 'react'
import { IListProps } from '../types'
import styles from './ListHeader.module.scss'
import { IListHeaderProps } from './types'
import strings from 'PortfolioWebPartsStrings'
import { UserMessage } from 'pp365-shared-library'

/**
 * Component for displaying a Sticky list header.
 */
const ListHeader: FC<IListHeaderProps> = (props) => {
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
          <SearchBox
            placeholder={strings.SearchBoxPlaceholderFallbackText}
            {...props.searchBox}
            disabled={props?.searchBox?.disabled || !!props.error} />
        </div>
        {props.defaultRender && (
          <div className={styles.headerColumns}>{props.defaultRender(props.headerProps)}</div>
        )}
        {props.error && (
          <UserMessage type={MessageBarType.error} text={props.error.message} />
        )}
      </div>
    </Sticky>
  )
}

export const useOnRenderDetailsHeader = (props: IListProps): IRenderFunction<IDetailsHeaderProps> =>
  useMemo(
    () => (headerProps, defaultRender) =>
      <ListHeader {...props} headerProps={headerProps} defaultRender={defaultRender} />,
    [props]
  )
