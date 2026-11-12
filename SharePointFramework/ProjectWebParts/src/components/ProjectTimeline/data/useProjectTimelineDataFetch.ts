import { useEffect } from 'react'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { IProjectTimelineProps, IProjectTimelineState } from '../types'
import { fetchData } from './fetchData'

/**
 * Reloads timeline data when its refresh timestamp changes. A fetch that fails is counted for
 * usage statistics, by its error code, and shown as before.
 */
export const useProjectTimelineDataFetch = (
  props: IProjectTimelineProps,
  refetch: number,
  fetchCallback: (data: Partial<IProjectTimelineState>) => void
) => {
  const telemetry = useTelemetry()
  useEffect(() => {
    void fetchData(props).then((data) => {
      // `fetchData` never rejects: a failed fetch resolves with the error the timeline shows.
      if (data.error) telemetry.trackError(data.error)
      fetchCallback(data)
    })
  }, [refetch])
}
