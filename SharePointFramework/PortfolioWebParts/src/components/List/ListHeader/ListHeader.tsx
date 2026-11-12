import React, { FC, useContext } from 'react'
import styles from './ListHeader.module.scss'
import { IListHeaderProps } from './types'
import strings from 'PortfolioWebPartsStrings'
import { UserMessage, WebPartTitle } from 'pp365-shared-library'
import { SearchBox } from '@fluentui/react-components'
import { Toolbar } from 'pp365-shared-library'
import { ListContext } from '../context'

/**
 * The pinned command bar of `List`: its title, search box and toolbar, or the fetch error.
 */
export const ListHeader: FC<IListHeaderProps> = (props) => {
  const context = useContext(ListContext)
  const hasError = !!props.error
  return (
    <div ref={props.commandBarRef} className={styles.commandBar}>
      <div className={styles.commands}>
        {props.title && (
          <div className={styles.header}>
            <WebPartTitle title={props.title} />
          </div>
        )}
        {hasError ? (
          <div className={styles.errorContainer}>
            <UserMessage title={strings.ErrorTitle} text={props.error.message} intent='error' />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
