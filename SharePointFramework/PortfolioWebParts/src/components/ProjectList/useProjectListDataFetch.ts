import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import resource from 'SharedResources'
import { useEffect } from 'react'
import { IProjectListProps, IProjectListState } from './types'

/**
 * Fetch enriched projects and the portfolio insight-group visibility flag. A fetch that fails is
 * counted for usage statistics, once, by its error code.
 */
export function useProjectListDataFetch(
  props: IProjectListProps,
  setState: (newState: Partial<IProjectListState>) => void
) {
  const telemetry = useTelemetry()
  useEffect(() => {
    void Promise.all([
      props.dataAdapter.fetchEnrichedProjects({
        primaryUserField: props.primaryUserField,
        secondaryUserField: props.secondaryUserField,
        primaryField: props.primaryField,
        secondaryField: props.secondaryField,
        includeClosed: props.showClosedProjects
      }),
      props.dataAdapter.isUserInGroup(resource.Security_SiteGroup_PortfolioInsight_Title)
    ])
      .then(([projects, isUserInPortfolioManagerGroup]) => {
        setState({
          projects,
          isDataLoaded: true,
          isUserInPortfolioManagerGroup
        })
      })
      .catch((error) => {
        telemetry.trackError(error)
        setState({
          projects: [],
          isDataLoaded: true,
          error: error?.message ?? String(error)
        })
      })
  }, [])
}
