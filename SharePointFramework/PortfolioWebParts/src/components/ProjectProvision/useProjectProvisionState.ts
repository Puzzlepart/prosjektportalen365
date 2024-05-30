/* eslint-disable prefer-spread */
import { useState } from 'react'
import { IProjectProvisionState, IProjectProvisionProps } from './types'

/**
 * Component state hook for `ProjectProvision`.
 *
 * @param props Props
 */
export function useProjectProvisionState(props: IProjectProvisionProps) {
  const [state, $setState] = useState<IProjectProvisionState>({
    loading: true,
    showProvisionDrawer: false,
    showProvisionStatus: false,
    settings: new Map<string, any>(),
    types: {},
    properties: {
      type: 'Project',
      hubSite: props.pageContext.legacyPageContext.hubSiteId
    }
  })

  /**
   * Set state like `setState` in class components where
   * the new state is merged with the current state.
   *
   * @param newState New state
   */
  const setState = (newState: Partial<IProjectProvisionState>) =>
    $setState((currentState) => ({ ...currentState, ...newState }))

  return { state, setState } as const
}
