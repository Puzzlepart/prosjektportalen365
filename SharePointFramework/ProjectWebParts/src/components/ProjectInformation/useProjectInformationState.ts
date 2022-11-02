import { useState } from 'react'
import { IProjectInformationState } from './types'

export const useProjectInformationState = () => {
  const [state, $setState] = useState<IProjectInformationState>({
    isDataLoaded: false,
    data: { sections: [] }
  })

  const setState = (newState: Partial<IProjectInformationState>) => {
    $setState((_state) => ({ ..._state, ...newState }))
  }

  return { state, setState }
}
