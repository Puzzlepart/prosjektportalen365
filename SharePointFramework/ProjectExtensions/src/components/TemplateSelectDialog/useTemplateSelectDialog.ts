import { useEffect, useReducer } from 'react'
import createReducer, { INIT, initState } from './reducer'
import { ITemplateSelectDialogProps } from './types'

export function useTemplateSelectDialog(props: ITemplateSelectDialogProps) {
  const [state, dispatch] = useReducer(createReducer(props.data), initState())

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
