import { useState } from 'react'
import { IProjectTimelineState } from './types'

/**
 * A custom React hook that returns the state and setState function
 * for the `ProjectTimeline` component.
 *
 * The deafault state is:
 *
 * ```typescript
 * {
 *    isDataLoaded: false,
 *    activeFilters: {},
 *    refetch: new Date().getTime()
 * }
 * ```
 *
 * @returns An object containing the current state and a function to update the state.
 */
export function useProjectTimelineState() {
  const [state, $setState] = useState<IProjectTimelineState>({
    isDataLoaded: false,
    activeFilters: {},
    selectedItems: [],
    refetch: new Date().getTime()
  })

  const setState = (newState: Partial<IProjectTimelineState>) => {
    $setState((_state) => ({ ..._state, ...newState }))
  }
  return { state, setState }
}
