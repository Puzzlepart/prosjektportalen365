import resource from 'SharedResources'
import { useEffect } from 'react'
import _ from 'underscore'
import { IProjectListProps, IProjectListState, IProjectListVertical } from './types'

/**
 * Component data fetch hook for `ProjectList`. This hook is responsible for
 * fetching data and setting state. It feches enriched projects using
 * `dataAdapter.fetchEnrichedProjects()` and checks if the current user is in
 * the `PortfolioInsight` group using `dataAdapter.isUserInGroup()`.
 * The selected vertical is set to the `defaultVertical` prop or the first vertical in the
 * `verticals` prop.
 *
 * @param props Props
 * @param verticals Verticals
 * @param setState Set state callback
 */
export function useProjectListDataFetch(
  props: IProjectListProps,
  verticals: IProjectListVertical[],
  setState: (newState: Partial<IProjectListState>) => void
) {
  useEffect(() => {
    Promise.all([
      props.dataAdapter.fetchEnrichedProjects({
        primaryUserField: props.primaryUserField,
        secondaryUserField: props.secondaryUserField,
        primaryField: props.primaryField,
        secondaryField: props.secondaryField
      }),
      props.dataAdapter.isUserInGroup(resource.Security_SiteGroup_PortfolioInsight_Title)
    ]).then(([projects, isUserInPortfolioManagerGroup]) => {
      const selectedVertical =
        _.find(verticals, (vertical) => vertical.key === props.defaultVertical) ??
        _.first(verticals)

      setState({
        projects,
        isDataLoaded: true,
        isUserInPortfolioManagerGroup,
        selectedVertical
      })
    })
  }, [])
}
