import {
  IDetailsHeaderProps,
  IRenderFunction,
  MessageBarType,
  Sticky,
  StickyPositionType
} from '@fluentui/react'
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
  const hasError = !!props.error
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
        {hasError && (
          <div className={styles.errorContainer}>
            <UserMessage type={MessageBarType.error} text={props.error.message} />
          </div>
        )}
        <div
          className={styles.searchBoxContainer}
          hidden={!props.searchBox || props?.searchBox?.hidden || hasError}
        >
          <SearchBox placeholder={strings.SearchBoxPlaceholderFallbackText} {...props.searchBox} />
        </div>
        {props.defaultRender && (
          <div className={styles.headerColumns} hidden={hasError}>
            {props.defaultRender(props.headerProps)}
          </div>
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
