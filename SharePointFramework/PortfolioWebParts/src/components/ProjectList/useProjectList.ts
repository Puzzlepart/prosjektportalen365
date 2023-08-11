/* eslint-disable prefer-spread */
import { format, IColumn } from '@fluentui/react'
import { sortAlphabetically } from 'pp365-shared-library/lib/util/sortAlphabetically'
import _ from 'underscore'
import { IProjectListProps } from './types'
import { useProjectListDataFetch } from './useProjectListDataFetch'
import { useProjectListState } from './useProjectListState'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { SearchBoxProps } from '@fluentui/react-search-preview'
import { ButtonProps } from '@fluentui/react-components'

/**
 * Component logic hook for `ProjectList`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 *
 * @param props Props
 */
export const useProjectList = (props: IProjectListProps) => {
  const { state, setState } = useProjectListState(props)

  /**
   * Sorting on column header click
   *
   * @param _evt - Event
   * @param column - Column
   */
  function onListSort(_evt: React.MouseEvent<any>, column: IColumn): void {
    let isSortedDescending = column.isSortedDescending
    if (column.isSorted) {
      isSortedDescending = !isSortedDescending
    }
    const newSort = { fieldName: column.fieldName, isSortedDescending }
    setState({ sort: newSort })
  }

  /**
   * Get card actions. For now only `showProjectInfo` is handled.
   *
   * @param project - Project
   */
  function getCardActions(project: ProjectListModel): ButtonProps[] {
    return [
      {
        id: 'showProjectInfo',
        onClick: (event: React.MouseEvent<any>) => onExecuteCardAction(event, project),
        title: 'Show project info'
      }
    ]
  }

  /**
   * On execute card action. For now only `showProjectInfo` is handled.
   *
   * @param event - Event
   * @param project - Project
   */
  function onExecuteCardAction(event: React.MouseEvent<any>, project: ProjectListModel) {
    event.preventDefault()
    event.stopPropagation()
    switch (event.currentTarget.id) {
      case 'showProjectInfo':
        setState({ showProjectInfo: project })
        break
    }
  }

  /**
   * Filter projects based on the `filter` function from the `selectedVertical`
   * and the `searchTerm`. Then sort the projects based on the `sort` state.
   *
   * @param projects - Projects
   */
  function filterProjets(projects: ProjectListModel[]) {
    return projects
      .filter((project) => state.selectedVertical.filter(project, state))
      .filter((project) =>
        _.any(Object.keys(project), (key) => {
          const value = project[key]
          return (
            value &&
            typeof value === 'string' &&
            value.toLowerCase().indexOf(state.searchTerm.toLowerCase()) !== -1
          )
        })
      )
      .sort((a, b) =>
        sortAlphabetically<ProjectListModel>(
          a,
          b,
          state?.sort?.isSortedDescending,
          state?.sort?.fieldName
        )
      )
  }

  /**
   * On search callback handler
   *
   * @param _ - React change event
   * @param searchTerm - Search term
   */
  const onSearch: SearchBoxProps['onChange'] = (_, data) => {
    setState({ searchTerm: data?.value })
  }

  const projects = state.isDataLoaded ? filterProjets(state.projects) : state.projects
  const verticals = props.verticals.filter(
    (vertical) => !props.hideVerticals.includes(vertical.key.toString())
  )

  useProjectListDataFetch(props, verticals, setState)

  return {
    state,
    setState,
    projects,
    verticals,
    getCardActions,
    searchBoxPlaceholder:
      !state.isDataLoaded || _.isEmpty(state.projects)
        ? ''
        : format(state.selectedVertical.searchBoxPlaceholder, projects.length),
    onListSort,
    onSearch
  } as const
}
