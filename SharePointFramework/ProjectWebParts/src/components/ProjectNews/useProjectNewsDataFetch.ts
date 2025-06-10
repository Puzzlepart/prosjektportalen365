import { useEffect } from 'react'
import { IProjectNewsProps, IProjectNewsState } from './types'

/**
 * Component data fetch hook for `ProjectNews`. This hook is responsible for
 * fetching data and setting state.
 *
 * @param props Props
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 * @param setState Set state callback
 */
export function useProjectNewsDataFetch(
  props: IProjectNewsProps,
  refetch: number,
  setState: (newState: Partial<IProjectNewsState>) => void
) {
  useEffect(() => {
    // TODO: Implement data fetching logic for Project News
  }, [refetch])
}
