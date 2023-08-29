import { IDetailsHeaderProps, IRenderFunction, Sticky, StickyPositionType } from '@fluentui/react'
import React, { FC, useMemo } from 'react'
import { IListProps } from '../types'
import styles from './ListHeader.module.scss'
import { IListHeaderProps } from './types'
import strings from 'PortfolioWebPartsStrings'
import { WebPartTitle } from 'pp365-shared-library'
import { Commands } from '../Commands'
import { SearchBox } from '@fluentui/react-search-preview'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'

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
      <FluentProvider className={styles.root} theme={webLightTheme}>
        <div className={styles.header}>
          <WebPartTitle text={props.title} />
        </div>

        {hasError && (
          <div className={styles.errorContainer}>
            <Alert intent='error'>{props.error.message}</Alert>
          </div>
        )}
        <div className={styles.commandBar}>
          <div
            className={styles.search}
            hidden={!props.searchBox || props?.searchBox?.hidden || hasError}
          >
            <SearchBox
              className={styles.searchBox}
              // disabled={!state.isDataLoaded || isEmpty(state.projects)}
              placeholder={strings.SearchBoxPlaceholderFallbackText}
              aria-label={strings.SearchBoxPlaceholderFallbackText}
              title={strings.SearchBoxPlaceholderFallbackText}
              size='large'
              appearance='filled-lighter'
              {...props.searchBox}
            />
          </div>
          <Commands />
        </div>
        {props.defaultRender && (
          <div className={styles.headerColumns} hidden={hasError}>
            {props.defaultRender(props.headerProps)}
          </div>
        )}
      </FluentProvider>
    </Sticky>
  )
}

export const useOnRenderDetailsHeader = (props: IListProps): IRenderFunction<IDetailsHeaderProps> =>
  useMemo(
    () => (headerProps, defaultRender) =>
      <ListHeader {...props} headerProps={headerProps} defaultRender={defaultRender} />,
    [props]
  )
