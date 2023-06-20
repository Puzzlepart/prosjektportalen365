import React from 'react'
import { IProjectInformationProps, IProjectInformationState } from './types'

export interface IProjectInformationContext {
  props: IProjectInformationProps
  state: IProjectInformationState
  setState: (newState: Partial<IProjectInformationState>) => void
  onSyncProperties: (force?: boolean) => void
}

export const ProjectInformationContext =
  React.createContext<IProjectInformationContext>(null)
