import { useState } from 'react'
import { IProjectProvisionState } from './types'

/**
 * State hook for `ProjectProvision`. `setState` shallow-merges into the
 * current state. The updater-function form is required for async flows
 * (e.g. `setDefaults` in `useEditableColumn`) so callers see the latest
 * committed state at commit time rather than the closure-captured value.
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

  const setState = (
    newState:
      | Partial<IProjectProvisionState>
      | ((current: IProjectProvisionState) => Partial<IProjectProvisionState>)
  ) =>
    $setState((current) => ({
      ...current,
      ...(typeof newState === 'function' ? newState(current) : newState)
    }))

  return { state, setState } as const
}
