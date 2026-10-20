import { useEffect } from 'react'
import { IProjectCardProps, IProjectCardState } from './types'

/**
 * Component data fetch hook for `ProjectCard`. This hook is responsible for
 * fetching data and setting state.
 *
 * @param props Props
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 * @param setState Set state callback
 */
export function useProjectCardDataFetch(
  props: IProjectCardProps,
  refetch: number,
  setState: (newState: Partial<IProjectCardState>) => void
) {
  useEffect(() => {
    props.dataAdapter
      .fetchEnrichedProject(props.projectSiteId, props.hubContext)
      .then((project) => setState({ project, isDataLoaded: true, loading: false }))
      // A failure was not caught, and the web part stayed empty: it says so now.
      .catch((error: Error) => {
        // eslint-disable-next-line no-console
        console.error('(ProjectCard) could not fetch the project', error)
        setState({ error, loading: false })
      })
  }, [refetch])
}
