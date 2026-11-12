import { useState } from 'react'
import { IIdeaApprovalDialogState } from './types'

/** Stores the selected decision and comment, merging partial form updates. */
export const useIdeaApprovalDialogState = () => {
  const [state, $setState] = useState<IIdeaApprovalDialogState>({
    choice: '',
    comment: ''
  })

  const setState = (newState: Partial<IIdeaApprovalDialogState>) => {
    $setState((_state) => ({ ..._state, ...newState }))
  }

  return { state, setState }
}
