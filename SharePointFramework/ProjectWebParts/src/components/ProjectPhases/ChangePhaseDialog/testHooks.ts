import { act, render } from '@testing-library/react'
import * as React from 'react'

/**
 * Runs a reducer hook inside a throwaway component, dispatches the first action, and hands back
 * the state plus a `dispatch` that returns the state after the action.
 */
export function renderHook<S>(
  useHook: () => { state: S; dispatch: (action: any) => void },
  initialAction?: any
) {
  const captured: { state: S; dispatch: (action: any) => void } = {
    state: undefined,
    dispatch: undefined
  }
  const Probe: React.FC = () => {
    Object.assign(captured, useHook())
    return null
  }
  render(React.createElement(Probe))
  const dispatch = (action: any): S => {
    act(() => captured.dispatch(action))
    return captured.state
  }
  if (initialAction) dispatch(initialAction)
  return {
    get state() {
      return captured.state
    },
    dispatch
  }
}
