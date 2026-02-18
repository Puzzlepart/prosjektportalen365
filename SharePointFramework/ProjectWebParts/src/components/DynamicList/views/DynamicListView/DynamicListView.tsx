import * as React from 'react'
import { FC, useContext } from 'react'
import { DynamicListContext } from '../../context'
import { useColumns } from '../../useColumns'
import { useFilteredData } from '../../useFilteredData'
import { ListView } from '../ListView'
import styles from './DynamicListView.module.scss'
import * as strings from 'ProjectWebPartsStrings'

/**
 * Renders list data in a multi-column table view with sorting, filtering, and selection.
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
      emptyMessage={strings.DynamicList.NoItemsToShow}
      noColumnsMessage={strings.DynamicList.NoColumnsToShow}
      className={styles.dynamicListView}
    />
  )
}
