import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IChangePhaseDialogState, INextChecklistItemParams } from './types'

export interface IChangePhaseDialogContext {
  state: IChangePhaseDialogState
  dispatch: React.Dispatch<AnyAction>
  nextChecklistItem: (params: INextChecklistItemParams) => void
}

export const ChangePhaseDialogContext = createContext<IChangePhaseDialogContext>(null)
