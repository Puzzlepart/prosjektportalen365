import { AnyAction } from '@reduxjs/toolkit'
import { createContext, Dispatch } from 'react'
import { IProjectPhasesProps, IProjectPhasesState } from './types'

export interface IProjectPhasesContext {
  state: IProjectPhasesState
  props: IProjectPhasesProps
  dispatch: Dispatch<AnyAction>
  onChangePhase: () => Promise<void>
}

export const ProjectPhasesContext = createContext<IProjectPhasesContext>(null)
