import { DataGridList } from 'pp365-shared-library'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import * as React from 'react'
import { useContext } from 'react'
import styles from './List.module.scss'
import { ListContext } from './context'
import { useList } from './useList'

/** The title's cell holds the project's link: Enter takes the focus to it, the arrows pass it. */
const GROUPED_COLUMNS = ['title']

/** Render configured project metadata in the shared sortable data grid. */
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
        groupedColumns={GROUPED_COLUMNS}
        size={context.size}
      />
    </div>
  )
}
