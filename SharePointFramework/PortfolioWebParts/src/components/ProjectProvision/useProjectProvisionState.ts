/* eslint-disable prefer-spread */
import { useState } from 'react'
import { IProjectProvisionState } from './types'

/**
 * Component state hook for `ProjectProvision`.
 *
 * @param props Props
 */
export function useProjectProvisionState() {
  const [state, $setState] = useState<IProjectProvisionState>({
    loading: true,
    error: null,
    showProvisionDrawer: false,
    showProvisionStatus: false,
    showProvisionSettings: false,
    showProvisionConfirmation: false,
    settings: [],
    types: {},
    siteTemplates: {},
    teamTemplates: {},
    sensitivityLabels: {},
    sensitivityLabelsLibrary: {},
    retentionLabels: {},
    requests: [],
    properties: {},
    refetch: new Date().getTime(),
    searchTerm: '',
    isRefetching: false
  })

  /**
   * Set state like `setState` in class components where
   * the new state is merged with the current state.
   *
   * Accepts either a partial state object, or an updater function that
   * receives the current state and returns a partial. The updater form
   * is essential for async flows so callers read the latest committed
   * state at commit time rather than capturing it at scheduling time.
   *
   * @param newState New state or updater function
   */
  const setState = (
    newState:
      | Partial<IProjectProvisionState>
      | ((current: IProjectProvisionState) => Partial<IProjectProvisionState>)
  ) =>
    $setState((currentState) => ({
      ...currentState,
      ...(typeof newState === 'function' ? newState(currentState) : newState)
    }))

  return { state, setState } as const
}
