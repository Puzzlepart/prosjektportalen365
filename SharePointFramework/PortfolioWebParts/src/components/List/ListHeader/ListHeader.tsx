import React, { FC, useContext } from 'react'
import styles from './ListHeader.module.scss'
import { IListHeaderProps } from './types'
import strings from 'PortfolioWebPartsStrings'
import { UserMessage, WebPartTitle, Toolbar, getSearchBoxDismissProps } from 'pp365-shared-library'
import { SearchBox } from '@fluentui/react-components'
import { ListContext } from '../context'

/**
 * The pinned command bar of `List`: its title, search box and toolbar, or the fetch error. The
 * search box is named by what it searches, the text it shows («Søk i Alle prosjekter...»), not
 * by the fallback «Søk...» (WCAG 2.5.3), and its clear button in Norwegian, where Fluent named it
 * «clear» (WCAG 3.1.2).
 */
export const ListHeader: FC<IListHeaderProps> = (props) => {
  const context = useContext(ListContext)
  const hasError = !!props.error
  const searchLabel =
    props.searchBox?.['aria-label'] ??
    props.searchBox?.placeholder ??
    strings.SearchBoxPlaceholderFallbackText
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
                size='large'
                appearance='filled-lighter'
                contentAfter={null}
                {...props.searchBox}
                aria-label={searchLabel}
                title={searchLabel}
                dismiss={getSearchBoxDismissProps()}
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
