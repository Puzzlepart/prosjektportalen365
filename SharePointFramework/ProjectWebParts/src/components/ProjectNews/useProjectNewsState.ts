/* eslint-disable prefer-spread */
import { useState } from 'react'
import { IProjectNewsState } from './types'

/**
 * Component state hook for `ProjectNews`.
 *
 * @param props Props
 */
export function useProjectNewsState() {
  const [state, $setState] = useState<IProjectNewsState>({
    loading: true,
    error: null,
    refetch: new Date().getTime()
  })

  /**
   * Set state like `setState` in class components where
   * the new state is merged with the current state.
   *
   * @param newState New state
   */
  const setState = (newState: Partial<IProjectNewsState>) =>
    $setState((currentState) => ({ ...currentState, ...newState }))

  return { state, setState } as const
}
