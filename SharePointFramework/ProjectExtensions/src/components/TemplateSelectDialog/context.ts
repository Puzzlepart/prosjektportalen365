import { createContext } from 'react'
import { ITemplateSelectDialogProps, ITemplateSelectDialogState } from './types'

export interface ITemplateSelectDialogContext {
  props: ITemplateSelectDialogProps
  state: ITemplateSelectDialogState
  setState: React.Dispatch<React.SetStateAction<ITemplateSelectDialogState>>
}

export const TemplateSelectDialogContext = createContext<ITemplateSelectDialogContext>(null)
