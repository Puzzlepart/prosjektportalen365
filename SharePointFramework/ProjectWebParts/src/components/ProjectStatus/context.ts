/* eslint-disable prefer-spread */
import { useToastController } from '@fluentui/react-components'
import { AnyAction } from '@reduxjs/toolkit'
import { createContext, useContext } from 'react'
import { IProjectStatusProps, IProjectStatusState } from './types'

export interface IProjectStatusContext {
  props: IProjectStatusProps
  state: IProjectStatusState
  dispatch?: React.Dispatch<AnyAction>
  testToast?: () => void
}

export const ProjectStatusContext = createContext<IProjectStatusContext>(null)

export const useProjectStatusContext = () => useContext(ProjectStatusContext)
