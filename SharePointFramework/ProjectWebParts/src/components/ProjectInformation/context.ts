import { UnknownAction } from '@reduxjs/toolkit'
import { createContext, useContext } from 'react'
import { IProjectInformationProps, IProjectInformationState } from './types'

/** Project information configuration, loaded state and reducer dispatch. */
export interface IProjectInformationContext {
  props: IProjectInformationProps
  state: IProjectInformationState
  dispatch: React.Dispatch<UnknownAction>
}

const ProjectInformationContext = createContext<IProjectInformationContext>(null)

/** Reads the current project information context. */
export const useProjectInformationContext = () => useContext(ProjectInformationContext)

/** Supplies project information state to its sections and dialogs. */
export const ProjectInformationContextProvider = ProjectInformationContext.Provider
