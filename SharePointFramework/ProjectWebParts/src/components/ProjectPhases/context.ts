import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IProjectPhasesProps, IProjectPhasesState } from './types'

export interface IProjectPhasesContext<S, P, D = React.Dispatch<AnyAction>> {
    state: S
    props: P
    dispatch: D
}

export const ProjectPhasesContext = createContext<IProjectPhasesContext<IProjectPhasesState, IProjectPhasesProps>>(null)