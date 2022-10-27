import { ProjectListModel } from 'models'
import { IButtonProps, IColumn } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { sortAlphabetically } from 'pp365-shared/lib/helpers'
import { useEffect, useState } from 'react'
import { IProjectListProps, IProjectListState } from './types'

export const useProjectList = (props: IProjectListProps) => {
  const [state, $setState] = useState<IProjectListState>({
    loading: true,
    searchTerm: '',
    showAsTiles: props.showAsTiles,
    selectedView: 'my_projects',
    // eslint-disable-next-line prefer-spread
    projects: Array.apply(null, Array(24)).map(() => 0),
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
        {
          setState({ showProjectInfo: project })
        }
        break
    }
  }

  /**
   * Filter projects
   *
   * @param projects - Projects
   */
  function filterProjets(projects: ProjectListModel[]) {
    return projects
      .filter((project) => {
        if (state.selectedView === 'my_projects') return project.userIsMember
        if (state.selectedView === 'parent_projects') return project.isParent
        if (state.selectedView === 'program') return project.isProgram
        return true
      })
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

  /**
   * Get searchbox placeholder text based on `state.selectedView`
   */
  function getSearchBoxPlaceholder() {
    switch (state.selectedView) {
      case 'my_projects':
        return strings.MyProjectsSearchBoxPlaceholderText
      case 'all_projects':
        return strings.AllProjectsSearchBoxPlaceholderText
      case 'parent_projects':
        return strings.ParentProjectsSearchBoxPlaceholderText
      case 'program':
        return strings.ProgramSearchBoxPlaceholderText
    }
  }

  useEffect(() => {
    Promise.all([
      props.dataAdapter.fetchEnrichedProjects(),
      props.dataAdapter.isUserInGroup(strings.PortfolioManagerGroupName)
    ]).then(([projects, isUserInPortfolioManagerGroup]) => {
      setState({
        ...state,
        projects,
        loading: true,
        isUserInPortfolioManagerGroup
      })
    })
  }, [])

  const projects = state.loading ? state.projects : filterProjets(state.projects)

  return {
    state,
    setState,
    projects,
    getCardActions,
    getSearchBoxPlaceholder,
    onListSort,
    onSearch
  } as const
}
