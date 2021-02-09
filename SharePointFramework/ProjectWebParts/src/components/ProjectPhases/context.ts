import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IProjectPhasesState } from './types'

export interface IProjectPhasesContext<S, D = React.Dispatch<AnyAction>> {
    state: S
    dispatch: D
}

export const ProjectPhasesContext = createContext<IProjectPhasesContext<IProjectPhasesState>>(null)