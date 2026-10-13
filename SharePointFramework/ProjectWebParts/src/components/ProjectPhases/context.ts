import { UnknownAction } from '@reduxjs/toolkit'
import { createContext, Dispatch } from 'react'
import { IProjectPhasesProps, IProjectPhasesState } from './types'

export interface IProjectPhasesContext {
  state: IProjectPhasesState
  props: IProjectPhasesProps
  dispatch: Dispatch<UnknownAction>
}

export const ProjectPhasesContext = createContext<IProjectPhasesContext>(null)
