import { FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'
import React, { CSSProperties, FC } from 'react'
import { ListContext } from './context'
import styles from './List.module.scss'
import { ListGrid } from './ListGrid'
import { ListHeader } from './ListHeader'
import { IListProps } from './types'
import { useList } from './useList'

/**
 * The hub's list, for the portfolio overview and the aggregated overview: a header with the
 * title, the search box and the toolbar, and the rows on Fluent UI v9's `Table`, grouped or not.
 * The list fills SharePoint's main content area and scrolls there, with the command bar and the
 * column headers pinned at its top.
 */
export const List: FC<IListProps<any>> = (props) => {
  const fluentProviderId = useId('fp-list')
  const { columns, onRenderItemColumn, onColumnHeaderClick, commandBarRef, stickyTop } =
    useList(props)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <ListContext.Provider value={{ props }}>
          <div
            className={styles.scrollContainer}
            style={{ '--pp-list-sticky-top': `${stickyTop}px` } as CSSProperties}
          >
            <ListHeader {...props} commandBarRef={commandBarRef} />
            {!props.error && (
              <ListGrid
                title={props.title}
                items={props.items}
                columns={columns}
                groups={props.groups}
                loading={props.enableShimmer}
                compact={props.compact}
                justified={props.isListLayoutModeJustified}
                onColumnHeaderClick={onColumnHeaderClick}
                onColumnHeaderContextMenu={onColumnHeaderClick}
                onSelectionChange={props.onSelectionChange}
                renderCell={onRenderItemColumn}
              />
            )}
          </div>
        </ListContext.Provider>
      </FluentProvider>
    </IdPrefixProvider>
  )
}

List.defaultProps = {
  items: [],
  columns: [],
  menuItems: [],
  isListLayoutModeJustified: false
}
