import { UnknownAction } from '@reduxjs/toolkit'
import { createContext, useContext } from 'react'
import { IProjectInformationProps, IProjectInformationState } from './types'

export interface IProjectInformationContext {
  props: IProjectInformationProps
  state: IProjectInformationState
  dispatch: React.Dispatch<UnknownAction>
}

const ProjectInformationContext = createContext<IProjectInformationContext>(null)

export const useProjectInformationContext = () => useContext(ProjectInformationContext)

export const ProjectInformationContextProvider = ProjectInformationContext.Provider
