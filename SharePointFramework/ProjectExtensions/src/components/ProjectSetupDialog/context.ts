import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IProjectSetupDialogProps, IProjectSetupDialogState } from './types'

export interface ITemplateSelectDialogContext {
  props: IProjectSetupDialogProps
  state: IProjectSetupDialogState
  dispatch: React.Dispatch<AnyAction>
}

export const TemplateSelectDialogContext = createContext<ITemplateSelectDialogContext>(null)
