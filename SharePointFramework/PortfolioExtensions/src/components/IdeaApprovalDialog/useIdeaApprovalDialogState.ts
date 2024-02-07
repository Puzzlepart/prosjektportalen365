import { useState } from 'react'
import { IIdeaApprovalDialogState } from './types'

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
