import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { ITemplateSelectDialogProps, ITemplateSelectDialogState } from './types'

export interface ITemplateSelectDialogContext {
  props: ITemplateSelectDialogProps
  state: ITemplateSelectDialogState
  dispatch: React.Dispatch<AnyAction>
}

export const TemplateSelectDialogContext =
  createContext<ITemplateSelectDialogContext>(null)
