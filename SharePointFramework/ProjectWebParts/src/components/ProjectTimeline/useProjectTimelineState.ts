import { useState } from 'react'
import { IProjectTimelineState } from './types'

export function useProjectTimelineState() {
  const [state, $setState] = useState<IProjectTimelineState>({
    isDataLoaded: false,
    activeFilters: {},
    panel: {
      isOpen: false
    },
    refetch: new Date().getTime()
  })

  const setState = (newState: Partial<IProjectTimelineState>) => {
    $setState((_state) => ({ ..._state, ...newState }))
  }
  return { state, setState }
}
