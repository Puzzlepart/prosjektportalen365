/* eslint-disable prefer-spread */
import { useEffect, useReducer } from 'react'
import { IProjectStatusContext } from './context'
import reducer, { initialState } from './reducer'
import { IProjectStatusProps } from './types'
import { useProjectStatusDataFetch } from './useProjectStatusDataFetch'
import { Toast, ToastBody, ToastTitle, useId, useToastController } from '@fluentui/react-components'
import React from 'react'

/**
 * Component logic hook for `ProjectStatus`
 */
export function useProjectStatus(props: IProjectStatusProps) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useProjectStatusDataFetch(props, state.refetch, dispatch)

  const context: IProjectStatusContext = {
    props,
    state,
    dispatch
  }

  return { context }
}
