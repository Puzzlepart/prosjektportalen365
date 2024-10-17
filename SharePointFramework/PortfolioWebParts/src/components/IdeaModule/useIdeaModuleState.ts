/* eslint-disable prefer-spread */
import { useState } from 'react'
import { IIdeaModuleState } from './types'

/**
 * Component state hook for `IIdeaModule`.
 *
 * @param props Props
 */
export function useIdeaModuleState() {
  const [state, $setState] = useState<IIdeaModuleState>({
    loading: true,
    configuration: [],
    ideas: {}
  })

  /**
   * Set state like `setState` in class components where
   * the new state is merged with the current state.
   *
   * @param newState New state
   */
  const setState = (newState: Partial<IIdeaModuleState>) =>
    $setState((currentState) => ({ ...currentState, ...newState }))

  return { state, setState } as const
}
