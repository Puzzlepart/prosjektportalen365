/* eslint-disable prefer-spread */
import { ButtonProps, useId } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { sortAlphabetically } from 'pp365-shared-library/lib/util/sortAlphabetically'
import _ from 'underscore'
import { IProjectCardContext } from './ProjectCard/context'
import { IProjectListProps } from './types'
import { useProjectListDataFetch } from './useProjectListDataFetch'
import { useProjectListState } from './useProjectListState'

/**
 * Component logic hook for `ProjectList`. Handles data fetching,
 * sorting, filtering and card actions.
 *
 * Verticals are built synchronously from `props.verticalConfigs`
 * in `useProjectListState`.
 */
export const useProjectList = (props: IProjectListProps) => {
  const fluentProviderId = useId('fp-project-list')
  const { state, setState } = useProjectListState(props)
  useProjectListDataFetch(props, setState)

  const verticals = state.verticals ?? []

  function getCardActions(project: ProjectListModel): ButtonProps[] {
    return [
      {
        id: 'showProjectInfo',
        onClick: (event: React.MouseEvent<any>) => onExecuteCardAction(event, project),
        title: strings.ProjectInformationPanelButton
      }
    ]
  }

  function onExecuteCardAction(event: React.MouseEvent<any>, project: ProjectListModel) {
    event.preventDefault()
    event.stopPropagation()
    switch (event.currentTarget.id) {
      case 'showProjectInfo':
        setState({ showProjectInfo: project })
        break
    }
  }

  function filterProjects(projects: ProjectListModel[]) {
    return projects
      .filter((project) =>
        state.selectedVertical?.filter ? state.selectedVertical.filter(project, state) : true
      )
      .filter((project) =>
        _.any(Object.keys(project), (key) => {
          let value = null
          if (Array.isArray(project[key]) && project[key].length > 0) {
            value = project[key]?.join(', ')
          } else if (typeof project[key] === 'object' && project[key] !== null) {
            value = Object.values(project[key])?.join(', ')
          } else {
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

  const projects = state.isDataLoaded ? filterProjects(state.projects) : state.projects

  const shouldDisplay = (key: string) => _.contains(props.projectMetadata, key)

  function createCardContext(project: ProjectListModel): IProjectCardContext {
    return {
      ...props,
      project,
      actions: getCardActions(project),
      isDataLoaded: state.isDataLoaded,
      shouldDisplay
    }
  }

  return {
    props,
    state,
    setState,
    projects,
    verticals,
    createCardContext,
    shouldDisplay,
    fluentProviderId
  }
}
