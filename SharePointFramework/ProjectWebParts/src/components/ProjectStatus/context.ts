/* eslint-disable prefer-spread */
import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IProjectStatusProps, IProjectStatusState } from './types'

export interface IProjectStatusContext {
  props: IProjectStatusProps
  state: IProjectStatusState
  dispatch?: React.Dispatch<AnyAction>
}

export const ProjectStatusContext = createContext<IProjectStatusContext>(null)
