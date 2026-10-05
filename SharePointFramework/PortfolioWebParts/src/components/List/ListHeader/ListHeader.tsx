import React, { FC, useContext } from 'react'
import styles from './ListHeader.module.scss'
import { IListHeaderProps } from './types'
import strings from 'PortfolioWebPartsStrings'
import { UserMessage, WebPartTitle } from 'pp365-shared-library'
import { SearchBox } from '@fluentui/react-components'
import { Toolbar } from 'pp365-shared-library'
import { ListContext } from '../context'

/**
 * Header for `List`: the title, which scrolls away with the rows, and the command bar with the
 * search box and the toolbar (or the error), which stays pinned at the top while they scroll.
 */
export const ListHeader: FC<IListHeaderProps> = (props) => {
  const context = useContext(ListContext)
  const hasError = !!props.error
  return (
    <>
      <div className={styles.header}>
        <WebPartTitle title={props.title} />
      </div>
      <div ref={props.commandBarRef} className={styles.commandBar}>
        {hasError ? (
          <div className={styles.errorContainer}>
            <UserMessage title={strings.ErrorTitle} text={props.error.message} intent='error' />
          </div>
        ) : (
          <div className={styles.commands}>
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
      </div>
    </>
  )
}
