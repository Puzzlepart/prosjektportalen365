import { useState } from 'react'
import { IProjectInformationState } from './types'

/**
 * Hook for `ProjectInformation` component state.
 *
 * @returns `state` and `setState` function for `ProjectInformation` component
 */
export const useProjectInformationState = () => {
  const [state, $setState] = useState<IProjectInformationState>({
    isDataLoaded: false,
    data: { sections: [], fields: [] }
  })

  const setState = (newState: Partial<IProjectInformationState>) => {
    $setState((_state) => ({ ..._state, ...newState }))
  }

  return { state, setState }
}
