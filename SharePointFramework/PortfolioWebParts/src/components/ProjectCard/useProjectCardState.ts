import { useState } from 'react'
import { IProjectCardState } from './types'

/**
 * Initialize single-card loading state and expose partial state updates.
 */
export function useProjectCardState() {
  const [state, $setState] = useState<IProjectCardState>({
    loading: true
  })

  /**
   * Set state like `setState` in class components where
   * the new state is merged with the current state.
   */
  const setState = (newState: Partial<IProjectCardState>) =>
    $setState((currentState) => ({ ...currentState, ...newState }))

  return { state, setState } as const
}
