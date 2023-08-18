import { AnyAction } from '@reduxjs/toolkit'
import { createContext, useContext } from 'react'
import { IProjectSetupDialogProps, IProjectSetupDialogState } from './types'

export interface IProjectSetupDialogContext {
  props: IProjectSetupDialogProps
  state: IProjectSetupDialogState
  dispatch: React.Dispatch<AnyAction>
}

export const ProjectSetupDialogContext = createContext<IProjectSetupDialogContext>(null)

/**
 * Hook to get the `ProjectSetupDialogContext`
 */
export function useProjectSetupDialogContext() {
  return useContext(ProjectSetupDialogContext)
}
