import strings from 'PortfolioWebPartsStrings'
import { useEffect } from 'react'
import _ from 'underscore'
import { IProjectListProps, IProjectListState, IProjectListView } from './types'

/**
 * Component data fetch hook for `ProjectList`. This hook is responsible for
 * fetching data and setting state.
 *
 * @param props Props
 * @param views Views
 * @param setState Set state callback
 */
export function useProjectListDataFetch(
  props: IProjectListProps,
  views: IProjectListView[],
  setState: (newState: Partial<IProjectListState>) => void
) {
  useEffect(() => {
    Promise.all([
      props.dataAdapter.fetchEnrichedProjects(),
      props.dataAdapter.isUserInGroup(strings.PortfolioManagerGroupName)
    ]).then(([projects, isUserInPortfolioManagerGroup]) => {
      views = views.filter((view) => _.any(projects, (project) => view.filter(project)))
      const selectedView =
        _.find(views, (view) => view.itemKey === props.defaultView) ?? _.first(views)
      setState({
        projects,
        isDataLoaded: true,
        isUserInPortfolioManagerGroup,
        selectedView
      })
    })
  }, [])
}
