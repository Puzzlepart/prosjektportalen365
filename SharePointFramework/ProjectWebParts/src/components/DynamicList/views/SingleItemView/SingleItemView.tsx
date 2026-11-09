import { FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import * as React from 'react'
import { FC, useContext } from 'react'
import { DynamicListContext } from '../../context'
import { useColumns } from '../../useColumns'
import styles from './SingleItemView.module.scss'
import { customLightTheme, UserMessage } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { NAVIGATION_FOCUS_ATTRIBUTE } from '../../useNavigationFocus'

/**
 * Renders a single list item in a detailed view.
 *
 * Displays all fields from the selected item or the first item in the list
 * if no specific item is selected. The item's title is a heading under the web part's, its
 * fields a description list (WCAG 1.3.1); an item opened from the list takes the focus on its
 * heading, or on its fields without one (`useNavigationFocus`).
 */
export const SingleItemView: FC = () => {
  const context = useContext(DynamicListContext)
  const fluentProviderId = useId('fp-single-view')
  const columns = useColumns()

  const item = context.state.selectedItem || context.state.data?.listItems?.[0]
  const showTitle = context.props.showItemTitle === undefined || context.props.showItemTitle
  const focusTarget = { [NAVIGATION_FOCUS_ATTRIBUTE]: true, tabIndex: -1 }

  if (!item) {
    return (
      <div style={{ padding: '0 32px' }}>
        <UserMessage
          title={strings.DynamicList.NoItemFound}
          text={strings.DynamicList.NoItemsMessage}
          intent='info'
        />
      </div>
    )
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <div className={styles.singleItemView}>
          {showTitle && (
            <div className={styles.header}>
              <h3 className={styles.title} {...focusTarget}>
                {item.Title || item?.FileLeafRef || strings.DynamicList.Untitled}
              </h3>
            </div>
          )}
          <dl className={styles.fields} {...(showTitle ? {} : focusTarget)}>
            {columns.map((column) => {
              const cellContent = column.renderCell
                ? column.renderCell(item)
                : (item as any)[column.columnId]

              return (
                <div key={column.columnId} className={styles.field}>
                  <dt className={styles.name}>
                    {column.renderHeaderCell ? column.renderHeaderCell() : column.columnId}
                  </dt>
                  <dd className={styles.value}>{cellContent}</dd>
                </div>
              )
            })}
          </dl>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
