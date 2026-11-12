import { useState } from 'react'
import { IProjectTimelineState } from './types'

/** Initializes timeline display and editing state with partial state updates. */
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
