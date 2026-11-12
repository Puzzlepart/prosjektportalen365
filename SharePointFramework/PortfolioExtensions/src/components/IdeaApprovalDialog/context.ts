import { createContext } from 'react'
import { IIdeaApprovalDialogProps, IIdeaApprovalDialogState } from './types'

/** Recommendation dialog props and optional form state exposed through context. */
export interface IIDeaApprovalDialogContext {
  props: IIdeaApprovalDialogProps
  state?: IIdeaApprovalDialogState
  setState: (newState: Partial<IIdeaApprovalDialogState>) => void
}

/** Context slot for the recommendation dialog host. */
export const IDeaApprovalDialogContext = createContext<IIDeaApprovalDialogContext>(null)
