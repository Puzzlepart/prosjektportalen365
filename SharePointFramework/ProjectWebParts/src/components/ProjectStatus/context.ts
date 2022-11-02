import { createContext } from 'react'
import { IProjectStatusProps, IProjectStatusState } from './types'

export interface IProjectStatusContext {
  props: IProjectStatusProps
  state: IProjectStatusState
  setState?: (newState: Partial<IProjectStatusState>) => void
}

export const ProjectStatusContext = createContext<IProjectStatusContext>(null)
