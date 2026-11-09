import { ButtonProps, useAnnounce, useId } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { sortAlphabetically } from 'pp365-shared-library/lib/util/sortAlphabetically'
import { Key, useEffect, useRef } from 'react'
import _ from 'underscore'
import { IProjectCardContext } from './ProjectCard/context'
import { IProjectListProps } from './types'
import { useProjectListDataFetch } from './useProjectListDataFetch'
import { useProjectListState } from './useProjectListState'

/**
 * How long a search waits after the last keystroke before it tells how many projects it shows.
 */
const SEARCH_ANNOUNCE_DELAY = 500

/**
 * Component logic hook for `ProjectList`. Handles data fetching,
 * sorting, filtering and card actions. A search tells how many of the selection's projects it
 * shows, once the user stops typing (WCAG 4.1.3).
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
        onClick: (event: React.MouseEvent<any>) => onExecuteCardAction(event, project)
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

  /** The projects of the selected vertical, before the search. */
  function inVertical(projects: ProjectListModel[]) {
    return projects.filter((project) =>
      state.selectedVertical?.filter ? state.selectedVertical.filter(project, state) : true
    )
  }

  function filterProjects(projects: ProjectListModel[]) {
    return inVertical(projects)
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

  const { announce } = useAnnounce()
  const isFirstSearch = useRef(true)
  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false
      return
    }
    if (!state.isDataLoaded) return
    const shown = projects.length
    const total = inVertical(state.projects).length
    const timer = setTimeout(
      () => announce(format(strings.ProjectsShownAnnouncement, shown, total), { polite: true }),
      SEARCH_ANNOUNCE_DELAY
    )
    return () => clearTimeout(timer)
  }, [state.searchTerm])

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

  /** The id of a selection's tab, which names the projects' panel while it is selected. */
  const getTabId = (key: Key) => `${fluentProviderId}-tab-${String(key)}`
  // While the list loads the tabs are skeletons: the panel would name itself by a tab not there.
  const selectedTabId =
    state.isDataLoaded && state.selectedVertical ? getTabId(state.selectedVertical.key) : undefined

  return {
    props,
    state,
    setState,
    projects,
    verticals,
    createCardContext,
    shouldDisplay,
    fluentProviderId,
    getTabId,
    selectedTabId
  }
}
