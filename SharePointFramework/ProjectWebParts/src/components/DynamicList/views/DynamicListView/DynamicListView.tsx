import * as React from 'react'
import { FC, useContext } from 'react'
import { DynamicListContext } from '../../context'
import { useColumns } from '../../useColumns'
import { useFilteredData } from '../../useFilteredData'
import { ListView } from '../ListView'
import styles from './DynamicListView.module.scss'

/**
 * Renders list data in a multi-column table view with sorting, filtering, and selection.
 *
 * Features:
 * - Resizable columns with sticky headers
 * - Multi-select with row checkboxes
 * - Column sorting
 * - Click first column to drill down to single item view
 * - Column widths from ProjectContentColumns configuration
 * - Custom cell rendering via ItemColumn system
 */
export const DynamicListView: FC = () => {
  const context = useContext(DynamicListContext)
  const columns = useColumns()
  const filteredItems = useFilteredData()

  const handleFirstColumnClick = (item: any) => {
    context.setState({
      selectedItem: item,
      isDrilledDown: true
    })
  }

  return (
    <ListView
      columns={columns as any}
      items={filteredItems}
      onFirstColumnClick={handleFirstColumnClick}
      emptyMessage='Ingen elementer å vise'
      noColumnsMessage='Ingen kolonner å vise'
      className={styles.dynamicListView}
    />
  )
}
