import { Sticky, StickyPositionType } from '@fluentui/react'
import React, { FC, useContext } from 'react'
import styles from './ListHeader.module.scss'
import { IListHeaderProps } from './types'
import strings from 'PortfolioWebPartsStrings'
import { UserMessage, WebPartTitle } from 'pp365-shared-library'
import { SearchBox } from '@fluentui/react-components'
import { Toolbar } from 'pp365-shared-library'
import { ListContext } from '../context'

/**
 * Header for `List`, rendered inside a v8 `Sticky`. Intentionally has no
 * nested `FluentProvider` — the root provider in `List` covers the header
 * even when stuck, and v8 `Sticky` renders its children twice, so an extra
 * provider would double the theme style tags on every sticky update.
 */
export const ListHeader: FC<IListHeaderProps> = (props) => {
  const context = useContext(ListContext)
  const hasError = !!props.error
  return (
    <Sticky
      stickyClassName={styles.sticky}
      stickyPosition={StickyPositionType.Header}
      isScrollSynced={true}
    >
      <div className={styles.root}>
        <div className={styles.header}>
          <WebPartTitle title={props.title} />
        </div>
        {hasError ? (
          <div className={styles.errorContainer}>
            <UserMessage title={strings.ErrorTitle} text={props.error.message} intent='error' />
          </div>
        ) : (
          <div className={styles.commandBar}>
            <div
              className={styles.search}
              hidden={!props.searchBox || props?.searchBox?.hidden || hasError}
            >
              <SearchBox
                className={styles.searchBox}
                placeholder={strings.SearchBoxPlaceholderFallbackText}
                aria-label={strings.SearchBoxPlaceholderFallbackText}
                title={strings.SearchBoxPlaceholderFallbackText}
                size='large'
                appearance='filled-lighter'
                contentAfter={null}
                {...props.searchBox}
              />
            </div>
            <Toolbar
              items={context?.props?.menuItems}
              filterPanel={context?.props?.filterPanelProps}
            />
          </div>
        )}
        {props.defaultRender && (
          <div className={styles.headerColumns} hidden={hasError}>
            {props.defaultRender(props.headerProps)}
          </div>
        )}
      </div>
    </Sticky>
  )
}
