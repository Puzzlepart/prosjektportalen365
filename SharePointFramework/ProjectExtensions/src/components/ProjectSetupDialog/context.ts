import { UnknownAction } from '@reduxjs/toolkit'
import { createContext, useContext } from 'react'
import { IProjectSetupDialogProps, IProjectSetupDialogState } from './types'

/** Setup inputs, selections and actions shared by the wizard sections. */
export interface IProjectSetupDialogContext {
  props: IProjectSetupDialogProps
  state: IProjectSetupDialogState
  dispatch: React.Dispatch<UnknownAction>
}

/** Shares wizard configuration and selection state with its sections. */
export const ProjectSetupDialogContext = createContext<IProjectSetupDialogContext>(null)

/** Reads the setup wizard's inputs, selections and dispatch. */
export function useProjectSetupDialogContext() {
  return useContext(ProjectSetupDialogContext)
}
