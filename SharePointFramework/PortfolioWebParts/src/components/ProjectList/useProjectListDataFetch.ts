import strings from 'PortfolioWebPartsStrings'
import { useEffect } from 'react'
import _ from 'underscore'
import { IProjectListProps, IProjectListState, IProjectListView } from './types'

/**
 * Component data fetch hook for `ProjectList`. This hook is responsible for
 * fetching data and setting state. It feches enriched projects using
 * `dataAdapter.fetchEnrichedProjects()` and checks if the current user is in
 * the `PortfolioManagerGroupName` group using `dataAdapter.isUserInGroup()`.
 * The selected view is set to the `defaultView` prop or the first view in the
 * `views` prop.
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
      if (props.defaultView === 'all_projects' && !isUserInPortfolioManagerGroup) {
        props.defaultView = _.first(views).itemKey

        views.forEach((view) => {
          if (view.itemKey === 'all_projects') {
            view.isHidden = (state) => !state.isUserInPortfolioManagerGroup
          }
        })
      }

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
