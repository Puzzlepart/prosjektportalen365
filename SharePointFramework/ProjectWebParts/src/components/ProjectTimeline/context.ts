import React from 'react'
import { IProjectTimelineProps, IProjectTimelineState } from './types'

export interface IProjectTimelineContext {
  props: IProjectTimelineProps
  state: IProjectTimelineState
  setState: (newState: Partial<IProjectTimelineState>) => void
}

export const ProjectTimelineContext = React.createContext<IProjectTimelineContext>(null)
