import { useEffect } from 'react'
import { IProjectTimelineProps, IProjectTimelineState } from '../types'
import { fetchData } from './fetchData'

/** Reloads timeline data when its refresh timestamp changes. */
export const useProjectTimelineDataFetch = (
  props: IProjectTimelineProps,
  refetch: number,
  fetchCallback: (data: Partial<IProjectTimelineState>) => void
) => {
  useEffect(() => {
    void fetchData(props).then(fetchCallback)
  }, [refetch])
}
