import { useEffect, useReducer } from 'react'
import createReducer, { INIT, initialState } from './reducer'
import { ITemplateSelectDialogProps } from './types'
import _ from 'underscore'

export function useTemplateSelectDialog(props: ITemplateSelectDialogProps) {
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
   * tab is disabled if there is no configuration available, there is
   * no selected template or the selected template is forced.
   * 
   * @param type Type of configuration to check.
   * 
   * @returns `true` if the configuration is disabled.
   */
  const isConfigDisabled = (type: 'extensions' | 'contentConfig') =>
    _.isEmpty(props.data[type]) || !state.selectedTemplate || state?.selectedTemplate?.isForced

  return { state, dispatch, onSubmit, isConfigDisabled } as const
}
