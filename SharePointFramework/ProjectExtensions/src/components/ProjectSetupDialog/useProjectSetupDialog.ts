import { useEffect, useReducer } from 'react'
import createReducer, { INIT, initialState } from './reducer'
import { IProjectSetupDialogProps } from './types'
import _ from 'underscore'

/**
 * Component logic for the `ProjectSetupDialog` component.
 *
 * @param props Props for the `ProjectSetupDialog` component.
 */
export function useProjectSetupDialog(props: IProjectSetupDialogProps) {
  const [state, dispatch] = useReducer(createReducer(props.data), initialState)

  useEffect(() => {
    dispatch(INIT())
  }, [])

  /**
   * On submit the selected user configuration.
   */
  const onSubmit = () => {
    props.onSubmit(state)
  }

  /**
   * Checks if the configuration should be disabled. Configuration
   * tab is disabled if there is no configuration available or if there is
   * no selected template.
   *
   * @param type Type of configuration to check.
   *
   * @returns `true` if the configuration is disabled.
   */
  const isConfigDisabled = (type: 'extensions' | 'contentConfig') => {
    const items = props.data[type] as Array<{ hidden: boolean }>
    if (_.isEmpty(items) || !state.selectedTemplate) return true
    return items.every((item) => item.hidden)
  }

  return { state, dispatch, onSubmit, isConfigDisabled }
}
