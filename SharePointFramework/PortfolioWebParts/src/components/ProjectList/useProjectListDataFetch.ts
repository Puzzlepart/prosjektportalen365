import resource from 'SharedResources'
import { useEffect } from 'react'
import { IProjectListProps, IProjectListState } from './types'

/** Fetches enriched projects and group membership for `ProjectList`. */
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
