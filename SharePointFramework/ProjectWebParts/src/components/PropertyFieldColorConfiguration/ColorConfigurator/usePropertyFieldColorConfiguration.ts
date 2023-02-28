import { useEffect, useMemo, useReducer } from 'react'
import _ from 'underscore'
import { IPropertyFieldColorConfigurationProps } from '../types'
import createReducerWithProps, { INIT, REVERT_CONFIG } from './reducer'
import { IColorConfiguratorState } from './types'

export function usePropertyFieldColorConfiguration(props: IPropertyFieldColorConfigurationProps) {
  const reducer = useMemo(() => createReducerWithProps(props), [props])
  const [state, dispatch] = useReducer(reducer, { config: [] } as IColorConfiguratorState)

  useEffect(() => {
    dispatch(INIT())
  }, [])

  let onSave: () => void = null
  let onRevertDefault: () => void = null

  if (!_.isEqual(props.value, state.config)) {
    onSave = () => {
      props.onChange(null, state.config)
    }
  }
  if (!_.isEqual(props.defaultValue, state.config)) {
    onRevertDefault = () => {
      dispatch(REVERT_CONFIG())
      props.onChange(null, undefined)
    }
  }

  return { state, dispatch, onSave, onRevertDefault } as const
}
