/* eslint-disable prefer-spread */
import { useState } from 'react'
import { IProjectCardState } from './types'

/**
 * Component state hook for `IProjectCard`.
 *
 * @param props Props
 */
export function useProjectCardState() {
  const [state, $setState] = useState<IProjectCardState>({
    loading: true
  })

  /**
   * Set state like `setState` in class components where
   * the new state is merged with the current state.
   *
   * @param newState New state
   */
  const setState = (newState: Partial<IProjectCardState>) =>
    $setState((currentState) => ({ ...currentState, ...newState }))

  return { state, setState } as const
}
