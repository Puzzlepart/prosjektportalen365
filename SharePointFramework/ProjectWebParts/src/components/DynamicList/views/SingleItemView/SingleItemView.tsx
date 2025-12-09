import { Text } from '@fluentui/react-components'
import * as React from 'react'
import { FC, useContext } from 'react'
import { DynamicListContext } from '../../context'
import { useColumns } from '../../useColumns'
import styles from './SingleItemView.module.scss'

/**
 * Renders a single list item in a detailed field-by-field view.
 *
 * Displays all fields from the selected item or the first item in the list
 * if no specific item is selected. Uses the same column render system as
 * DynamicListView for consistent field rendering.
 */
export const SingleItemView: FC = () => {
  const context = useContext(DynamicListContext)
  const columns = useColumns()

  const item = context.state.selectedItem || context.state.data?.listItems?.[0]

  if (!item) {
    return (
      <div className={styles.singleItemView}>
        <div className={styles.emptyState}>
          <Text size={400}>Ingen elementer å vise</Text>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.singleItemView}>
      <div className={styles.header}>
        <h1 className={styles.title}>{item.Title || 'Uten tittel'}</h1>
      </div>
      <div className={styles.fields}>
        {columns.map((column) => {
          const columnDef = context.state.data?.listColumns?.find(
            (col) => col.key === column.columnId
          )
          if (!columnDef) return null

          const fieldValue = item[columnDef.fieldName]
          const renderedValue = column.renderCell ? column.renderCell(item) : fieldValue

          return (
            <div key={column.columnId} className={styles.field}>
              <Text weight='semibold' size={200} block>
                {column.renderHeaderCell ? column.renderHeaderCell() : column.columnId}
              </Text>
              <Text>{renderedValue}</Text>
            </div>
          )
        })}
      </div>
    </div>
  )
}
