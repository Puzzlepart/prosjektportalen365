/* eslint-disable prefer-spread */
import { format, IButtonProps, IColumn } from '@fluentui/react'
import { ProjectListModel } from 'models'
import { sortAlphabetically } from 'pp365-shared/lib/helpers'
import _ from 'underscore'
import { IProjectListProps } from './types'
import { useProjectListDataFetch } from './useProjectListDataFetch'
import { useProjectListState } from './useProjectListState'

/**
 * Component logic hook for `ProjectList`.
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
   * Get card ations
   *
   * @param project - Project
   */
  function getCardActions(project: ProjectListModel): IButtonProps[] {
    return [
      {
        id: 'ON_SELECT_PROJECT',
        iconProps: { iconName: 'OpenInNewWindow' },
        onClick: (event: React.MouseEvent<any>) => onExecuteCardAction(event, project)
      }
    ]
  }

  /**
   * On execute card action
   *
   * @param event - Event
   * @param project - Project
   */
  function onExecuteCardAction(event: React.MouseEvent<any>, project: ProjectListModel) {
    event.preventDefault()
    event.stopPropagation()
    switch (event.currentTarget.id) {
      case 'ON_SELECT_PROJECT':
        setState({ showProjectInfo: project })
        break
    }
  }

  /**
   * Filter projects based on `selectedView` and `searchTerm`
   *
   * @param projects - Projects
   */
  function filterProjets(projects: ProjectListModel[]) {
    return projects
      .filter((project) => state.selectedView.filter(project))
      .filter((project) =>
        _.any(Object.keys(project), (key) => {
          const value = project[key]
          return (
            value &&
            typeof value === 'string' &&
            value.toLowerCase().indexOf(state.searchTerm) !== -1
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
   * On search callback
   *
   * @param _event - React change event
   * @param searchTerm - Search term
   */
  function onSearch(_event: React.ChangeEvent<HTMLInputElement>, searchTerm: string) {
    setState({ searchTerm: searchTerm.toLowerCase() })
  }

  const projects = state.isDataLoaded ? filterProjets(state.projects) : state.projects
  const views = props.views.filter((view) => !props.hideViews.includes(view.itemKey))

  useProjectListDataFetch(props, views, setState)

  return {
    state,
    setState,
    projects,
    views,
    getCardActions,
    searchBoxPlaceholder: (!state.isDataLoaded || state.projects.length === 0)
      ? ''
      : format(state.selectedView.searchBoxPlaceholder, projects.length),
    onListSort,
    onSearch
  } as const
}
