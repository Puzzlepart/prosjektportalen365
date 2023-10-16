/* eslint-disable prefer-spread */
import { format, IColumn } from '@fluentui/react'
import { ButtonProps } from '@fluentui/react-components'
import { SearchBoxProps } from '@fluentui/react-search-preview'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { sortAlphabetically } from 'pp365-shared-library/lib/util/sortAlphabetically'
import _ from 'underscore'
import { IProjectCardContext } from './ProjectCard/context'
import { IProjectListProps } from './types'
import { useProjectListDataFetch } from './useProjectListDataFetch'
import { useProjectListState } from './useProjectListState'
import strings from 'PortfolioWebPartsStrings'
import { useToolbarItems } from './ToolbarItems/useToolbarItems'

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
    if (column.key !== 'logo') {
      let isSortedDescending = column.isSortedDescending
      if (column.isSorted) {
        isSortedDescending = !isSortedDescending
      }
      const newSort = { fieldName: column.fieldName, isSortedDescending }
      setState({ sort: newSort })
    }
    return
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
        title: strings.ProjectInformationPanelButton
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
  function filterProjects(projects: ProjectListModel[]) {
    return projects
      .filter((project) => state.selectedVertical.filter(project, state))
      .filter((project) =>
        _.any(Object.keys(project), (key) => {
          let value
          if (Array.isArray(project[key]) && project[key].length > 0) {
            value = project[key]?.join(', ')
          }
          else if (typeof project[key] === 'object' && project[key] !== null) {
            value = Object.values(project[key])?.join(', ')
          }
          else {
            value = project[key]
          }

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

  const projects = state.isDataLoaded ? filterProjects(state.projects) : state.projects
  const verticals = props.verticals.filter(
    (vertical) => !props.hideVerticals.includes(vertical.key.toString())
  )

  useProjectListDataFetch(props, verticals, setState)

  /**
   * Create card context for the provided project.
   *
   * @param project Project to create context for
   */
  function createCardContext(project: ProjectListModel): IProjectCardContext {
    const shouldDisplay = (key: string) => _.contains(props.projectMetadata, key)
    return {
      ...props,
      project,
      actions: getCardActions(project),
      isDataLoaded: state.isDataLoaded,
      shouldDisplay
    }
  }

  const menuItems = useToolbarItems(state, setState, props)

  return {
    state,
    setState,
    menuItems,
    projects,
    verticals,
    searchBoxPlaceholder:
      !state.isDataLoaded || _.isEmpty(state.projects)
        ? ''
        : format(state.selectedVertical.searchBoxPlaceholder, projects.length),
    onListSort,
    onSearch,
    createCardContext
  }
}
