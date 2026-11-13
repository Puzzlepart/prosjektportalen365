import { Logger, LogLevel } from '@pnp/logging'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { useEffect } from 'react'
import { IProjectCardProps, IProjectCardState } from './types'

/**
 * Component data fetch hook for `ProjectCard`. This hook is responsible for
 * fetching data and setting state. The project is fetched with the fields and person fields the
 * card shows, so a field chosen in the pane is there, and the people are found. A fetch that fails
 * is counted for usage statistics, once, by its error code.
 *
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 */
export function useProjectCardDataFetch(
  props: IProjectCardProps,
  refetch: number,
  setState: (newState: Partial<IProjectCardState>) => void
) {
  const telemetry = useTelemetry()
  useEffect(() => {
    props.dataAdapter
      .fetchEnrichedProject(props.projectSiteId, props.hubContext, {
        primaryField: props.primaryField,
        secondaryField: props.secondaryField,
        primaryUserField: props.primaryUserField,
        secondaryUserField: props.secondaryUserField
      })
      .then((project) => setState({ project, isDataLoaded: true, loading: false }))
      // A failure was not caught, and the web part stayed empty: it says so now.
      .catch((error: Error) => {
        telemetry.trackError(error)
        Logger.log({
          message: `(ProjectCard) could not fetch the project: ${error?.message}`,
          level: LogLevel.Error
        })
        setState({ error, loading: false })
      })
  }, [refetch])
}
