import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import resource from 'SharedResources'
import { useEffect } from 'react'
import { IProjectListProps, IProjectListState } from './types'

/**
 * Fetch enriched projects and the portfolio insight-group visibility flag. A fetch that fails is
 * counted for usage statistics, once, by its error code. The sites that await the project setup
 * are looked up beside them and handed over when they arrive, so the projects never wait for
 * them; that lookup resolves none when it fails.
 */
export function useProjectListDataFetch(
  props: IProjectListProps,
  setState: (newState: Partial<IProjectListState>) => void
) {
  const telemetry = useTelemetry()
  useEffect(() => {
    const fields = {
      primaryUserField: props.primaryUserField,
      secondaryUserField: props.secondaryUserField,
      primaryField: props.primaryField,
      secondaryField: props.secondaryField,
      includeClosed: props.showClosedProjects
    }
    if (props.awaitingSetupMaxAgeDays > 0 && props.dataAdapter.fetchProjectsAwaitingSetup) {
      void props.dataAdapter
        .fetchProjectsAwaitingSetup(props.awaitingSetupMaxAgeDays, fields)
        .then((awaitingSetup) => {
          if (awaitingSetup?.length) setState({ awaitingSetup })
        })
        .catch((): void => undefined)
    }
    void Promise.all([
      props.dataAdapter.fetchEnrichedProjects(fields),
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
