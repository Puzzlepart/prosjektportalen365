import { MessageBarType } from '@fluentui/react'
import { createContext, useContext } from 'react'
import { IProjectInformationProps, IProjectInformationState } from './types'

export interface IProjectInformationContext {
  props: IProjectInformationProps
  state: IProjectInformationState
  setState: (newState: Partial<IProjectInformationState>) => void
  addMessage: (text: string, type: MessageBarType, durationSec?: number) => Promise<void>
}

const ProjectInformationContext = createContext<IProjectInformationContext>(null)

export const useProjectInformationContext = () => useContext(ProjectInformationContext)

export const ProjectInformationContextProvider = ProjectInformationContext.Provider
