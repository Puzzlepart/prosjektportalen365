import { AnyAction } from '@reduxjs/toolkit'
import { createContext, Dispatch } from 'react'
import { IProjectPhasesProps, IProjectPhasesState } from './types'

export interface IProjectPhasesContext<
  S = IProjectPhasesState,
  P = IProjectPhasesProps,
  D = Dispatch<AnyAction>
> {
  state: S
  props: P
  dispatch: D
  onChangePhase: () => Promise<void>
}

export const ProjectPhasesContext = createContext<IProjectPhasesContext>(null)
