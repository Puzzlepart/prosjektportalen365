/* eslint-disable prefer-spread */
import { format, IButtonProps, IColumn } from '@fluentui/react'
import { ProjectListModel } from 'models'
import strings from 'PortfolioWebPartsStrings'
import { sortAlphabetically } from 'pp365-shared/lib/helpers'
import { useEffect, useState } from 'react'
import { find, first } from 'underscore'
import { ProjectListViews } from './ProjectListViews'
import { IProjectListProps, IProjectListState } from './types'

/**
 * Component logic hook for `ProjectList`.
 *
 * @param props Props
 */
export const useProjectList = (props: IProjectListProps) => {
  const [state, $setState] = useState<IProjectListState>({
    loading: true,
    searchTerm: '',
    renderAs: 'tiles',
    selectedView: find(ProjectListViews, view => view.itemKey === props.defaultView) ?? first(ProjectListViews),
    projects: Array.apply(null, Array(24)).map(() => 0),
    isUserInPortfolioManagerGroup: false,
    sort: { fieldName: props.sortBy, isSortedDescending: true }
  })

  const setState = (newState: Partial<IProjectListState>) =>
    $setState((state_) => ({ ...state_, ...newState }))

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
    setState({ sort: { fieldName: column.fieldName, isSortedDescending } })
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
      .filter((p) => {
        const matches = Object.keys(p).filter((key) => {
          const value = p[key]
          return (
            value &&
            typeof value === 'string' &&
            value.toLowerCase().indexOf(state.searchTerm) !== -1
          )
        }).length
        return matches > 0
      })
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
   * On search
   *
   * @param searchTerm - Search term
   */
  function onSearch(searchTerm: string) {
    setState({ searchTerm: searchTerm.toLowerCase() })
  }

  useEffect(() => {
    Promise.all([
      props.dataAdapter.fetchEnrichedProjects(),
      props.dataAdapter.isUserInGroup(strings.PortfolioManagerGroupName)
    ]).then(([projects, isUserInPortfolioManagerGroup]) => {
      setState({
        ...state,
        projects,
        loading: false,
        isUserInPortfolioManagerGroup
      })
    })
  }, [])

  const projects = state.loading ? state.projects : filterProjets(state.projects)
  const views = ProjectListViews.filter(view => !props.hideViews.includes(view.itemKey))

  return {
    state,
    setState,
    projects,
    views,
    getCardActions,
    searchBoxPlaceholder: format(state.selectedView.searchBoxPlaceholder, state.projects.length),
    onListSort,
    onSearch
  } as const
}
