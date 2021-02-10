import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IProjectPhasesProps, IProjectPhasesState } from './types'

export interface IProjectPhasesContext<S = IProjectPhasesState, P = IProjectPhasesProps, D = React.Dispatch<AnyAction>> {
    state: S
    props: P
    dispatch: D
    onChangePhase: () => Promise<void>
}

export const ProjectPhasesContext = createContext<IProjectPhasesContext>(null)