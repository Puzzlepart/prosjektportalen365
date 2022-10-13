import React from 'react'
import { IProjectTimelineProps, IProjectTimelineState } from './types'

export interface IProjectTimelineContext {
  props: IProjectTimelineProps
  state: IProjectTimelineState
  setState: (newState: Partial<IProjectTimelineState>) => void
  onGroupChange: (group: string) => void
}

export const ProjectTimelineContext = React.createContext<IProjectTimelineContext>(null)
