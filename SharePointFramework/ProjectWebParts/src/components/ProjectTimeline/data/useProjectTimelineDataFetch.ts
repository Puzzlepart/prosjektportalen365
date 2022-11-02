import { useEffect } from 'react'
import { IProjectTimelineProps, IProjectTimelineState } from '../types'
import { fetchData } from './fetchData'

/**
 * Fetch hook for ProjectTimeline
 *
 * @param props Component properties for `ProjectTimeline`
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 * @param fetchCallback Fetch callback
 */
export const useProjectTimelineDataFetch = (
  props: IProjectTimelineProps,
  refetch: number,
  fetchCallback: (data: Partial<IProjectTimelineState>) => void
) => {
  useEffect(() => {
    fetchData(props).then(fetchCallback)
  }, [refetch])
}
