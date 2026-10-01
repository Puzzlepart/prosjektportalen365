import { DataGridList } from 'pp365-shared-library'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import * as React from 'react'
import { useContext } from 'react'
import styles from './List.module.scss'
import { ListContext } from './context'
import { useList } from './useList'

export const List = () => {
  const context = useContext(ListContext)
  const { columns, defaultSortState } = useList()

  return (
    <div className={styles.list}>
      <DataGridList<ProjectListModel>
        items={context.projects}
        columns={columns}
        sortable
        defaultSortState={defaultSortState}
        size={context.size}
      />
    </div>
  )
}
