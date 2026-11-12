import { UnknownAction } from '@reduxjs/toolkit'
import { createContext, useContext } from 'react'
import { IProjectStatusProps, IProjectStatusState } from './types'

/** Status report configuration, loaded state and reducer dispatch. */
export interface IProjectStatusContext {
  props: IProjectStatusProps
  state: IProjectStatusState
  dispatch?: React.Dispatch<UnknownAction>
}

/** Shares the selected report and report-management state. */
export const ProjectStatusContext = createContext<IProjectStatusContext>(null)

/** Reads the current status report context. */
export const useProjectStatusContext = () => useContext(ProjectStatusContext)
