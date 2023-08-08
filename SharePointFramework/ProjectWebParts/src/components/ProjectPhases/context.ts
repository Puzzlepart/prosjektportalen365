import { AnyAction } from '@reduxjs/toolkit'
import { createContext, Dispatch } from 'react'
import { IProjectPhasesProps, IProjectPhasesState } from './types'

export interface IProjectPhasesContext {
  state: IProjectPhasesState
  props: IProjectPhasesProps
  dispatch: Dispatch<AnyAction>
}

export const ProjectPhasesContext = createContext<IProjectPhasesContext>(null)
