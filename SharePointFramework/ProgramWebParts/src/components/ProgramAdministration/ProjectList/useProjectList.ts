import { SearchBoxProps } from '@fluentui/react-components'
import { isEmpty } from '@microsoft/sp-lodash-subset'
import { IListColumn } from 'pp365-shared-library'
import { useContext, useMemo, useState } from 'react'
import { ProgramAdministrationContext } from '../context'
import { createColumns } from './columns'
import { createProjectRows, IProjectListSort } from './projectRows'
import { IProjectListProps } from './types'

/**
 * Component logic hook for `ProjectList`: the search, the sort, the rows and their hub groups
 * (`createProjectRows`), the columns, and the selection, kept by the caller as site ids and handed
 * to the grid as its rows. A row a search hides stays selected, so projects chosen in several
 * searches are all added (or removed); the grid's report covers only the rows it shows.
 *
 * @param props The list's props
 */
export function useProjectList(props: IProjectListProps) {
  const context = useContext(ProgramAdministrationContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState<IProjectListSort>({ fieldName: 'Title', ascending: true })

  const { rows, groups } = useMemo(
    () =>
      createProjectRows(props.items, {
        searchTerm,
        sort,
        programHubs: props.programHubs,
        defaultGroupsExpanded: props.defaultGroupsExpanded
      }),
    [props.items, searchTerm, sort, props.programHubs, props.defaultGroupsExpanded]
  )

  const columns = useMemo(() => createColumns(sort), [sort])

  const selectedIds = useMemo(() => new Set(props.selectedItems ?? []), [props.selectedItems])
  const selectedRows = useMemo(
    () => (props.selectedItems ? rows.filter(({ SiteId }) => selectedIds.has(SiteId)) : undefined),
    [rows, selectedIds, props.selectedItems]
  )

  const onSelectionChange = (selected: Record<string, any>[]) => {
    const shown = new Set(rows.map(({ SiteId }) => SiteId))
    const hidden = Array.from(selectedIds).filter((id) => !shown.has(id))
    props.onSelectionChange([...hidden, ...selected.map(({ SiteId }) => SiteId)])
  }

  const onColumnHeaderClick = (column: IListColumn) => {
    setSort((previous) => ({
      fieldName: column.fieldName,
      ascending: previous.fieldName === column.fieldName ? !previous.ascending : true
    }))
  }

  const onSearch: SearchBoxProps['onChange'] = (_, data) => {
    setSearchTerm(data?.value ?? '')
  }

  const selectionMode: 'multiselect' | 'none' = context.state.userHasManagePermission
    ? 'multiselect'
    : 'none'

  const showList =
    !isEmpty(context.state.childProjects) || context.state.loading || !!props.hideCommands

  return {
    rows,
    groups,
    columns,
    selectionMode,
    selectedRows,
    showList,
    onSelectionChange,
    onColumnHeaderClick,
    onSearch,
    searchTerm
  }
}
