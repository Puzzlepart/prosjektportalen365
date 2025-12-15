import { FluentProvider, IdPrefixProvider, Text, useId } from '@fluentui/react-components'
import * as React from 'react'
import { FC, useContext } from 'react'
import { DynamicListContext } from '../../context'
import { useColumns } from '../../useColumns'
import styles from './SingleItemView.module.scss'
import { customLightTheme, UserMessage } from 'pp365-shared-library'

/**
 * Renders a single list item in a detailed view.
 *
 * Displays all fields from the selected item or the first item in the list
 * if no specific item is selected.
 */
export const SingleItemView: FC = () => {
  const context = useContext(DynamicListContext)
  const fluentProviderId = useId('fp-single-view')
  const columns = useColumns()

  const item = context.state.selectedItem || context.state.data?.listItems?.[0]

  if (!item) {
    return (
      <div style={{ padding: '0 32px' }}>
        <UserMessage title='Ingen element funnet' text='Det finnes ingen elementer å vise' intent='info' />
      </div>
    )
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <div className={styles.singleItemView}>
          <div className={styles.header}>
            <h1 className={styles.title}>{item.Title || 'Uten tittel'}</h1>
          </div>
          <div className={styles.fields}>
            {columns.map((column) => {
              const cellContent = column.renderCell
                ? column.renderCell(item)
                : (item as any)[column.columnId]

              return (
                <div key={column.columnId} className={styles.field}>
                  <Text weight='semibold' size={200} block>
                    {column.renderHeaderCell ? column.renderHeaderCell() : column.columnId}
                  </Text>
                  <Text>{cellContent}</Text>
                </div>
              )
            })}
          </div>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
