import resource from 'SharedResources'
import { useEffect } from 'react'
import { IProjectListProps, IProjectListState } from './types'

/**
 * Component data fetch hook for `ProjectList`. This hook is responsible for
 * fetching async data: enriched projects and group membership. Verticals
 * and selected vertical are computed synchronously in `useProjectListState`.
 *
 * @param props Props
 * @param setState Set state callback
 */
export function useProjectListDataFetch(
  props: IProjectListProps,
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
      setState({
        projects,
        isDataLoaded: true,
        isUserInPortfolioManagerGroup
      })
    })
  }, [])
}
