import { useEffect, useReducer } from 'react'
import createReducer, { INIT, initialState } from './reducer'
import { ITemplateSelectDialogProps } from './types'

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

  return { state, dispatch, onSubmit } as const
}
