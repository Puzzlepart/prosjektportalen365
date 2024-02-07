import { createContext } from 'react'
import { IIdeaApprovalDialogProps, IIdeaApprovalDialogState } from './types'

export interface IIDeaApprovalDialogContext {
  props: IIdeaApprovalDialogProps
  state?: IIdeaApprovalDialogState
  setState: (newState: Partial<IIdeaApprovalDialogState>) => void
}

export const IDeaApprovalDialogContext = createContext<IIDeaApprovalDialogContext>(null)
