import { createContext } from 'react'
import { ITemplateSelectDialogProps, ITemplateSelectDialogState } from './types'

export interface ITemplateSelectDialogContext {
  props: ITemplateSelectDialogProps
  state: ITemplateSelectDialogState
  setState: (newState: ITemplateSelectDialogState) => void
}

export const TemplateSelectDialogContext = createContext<ITemplateSelectDialogContext>(null)
