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
    Promise.all([props.dataAdapter.fetchEnrichedProject(props.projectSiteId)]).then(([project]) => {
      setState({
        project,
        isDataLoaded: true
      })
    })
  }, [refetch])
}
