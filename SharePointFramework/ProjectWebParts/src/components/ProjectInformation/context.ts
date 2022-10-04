import React from 'react'
import { IProjectInformationProps, IProjectInformationState } from './types'

export interface IProjectInformationContext {
    props: IProjectInformationProps
    state: IProjectInformationState
}

export const ProjectInformationContext = React.createContext<IProjectInformationContext>(null)