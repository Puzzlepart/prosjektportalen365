import { UnknownAction } from '@reduxjs/toolkit'
import { createContext, Dispatch } from 'react'
import { IProjectPhasesProps, IProjectPhasesState } from './types'

/** Phase selector configuration, loaded data and reducer dispatch. */
export interface IProjectPhasesContext {
  state: IProjectPhasesState
  props: IProjectPhasesProps
  dispatch: Dispatch<UnknownAction>
}

/** Shares phase and permission state with phase details and the change dialog. */
export const ProjectPhasesContext = createContext<IProjectPhasesContext>(null)
