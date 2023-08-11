import React from 'react'
import { IProjectInformationProps, IProjectInformationState } from './types'
import { MessageBarType } from '@fluentui/react'

export interface IProjectInformationContext {
  props: IProjectInformationProps
  state: IProjectInformationState
  setState: (newState: Partial<IProjectInformationState>) => void
  addMessage: (text: string, type: MessageBarType, durationSec?: number) => Promise<void>
}

export const ProjectInformationContext = React.createContext<IProjectInformationContext>(null)
