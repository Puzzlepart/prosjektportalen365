import React from 'react'
import { IProjectTimelineProps, IProjectTimelineState } from './types'

/** Timeline configuration, loaded items and shared editing state. */
export interface IProjectTimelineContext {
  props: IProjectTimelineProps
  state: IProjectTimelineState
  setState: (newState: Partial<IProjectTimelineState>) => void
}

/** Shares timeline data and selection with the list and its commands. */
export const ProjectTimelineContext = React.createContext<IProjectTimelineContext>(null)
