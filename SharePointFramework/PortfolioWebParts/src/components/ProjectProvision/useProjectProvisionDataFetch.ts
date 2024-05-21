import { useEffect } from 'react'
import { IProjectProvisionProps, IProjectProvisionState } from './types'

/**
 * Component data fetch hook for `ProjectProvision`. This hook is responsible for
 * fetching data and setting state.
 *
 * @param props Props
 * @param verticals Verticals
 * @param setState Set state callback
 */
export function useProjectProvisionDataFetch(
  props: IProjectProvisionProps,
  setState: (newState: Partial<IProjectProvisionState>) => void
) {
  useEffect(() => {
    // Fetch stuff
  }, [])
}
