import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IChangePhaseDialogState } from './types'

export interface IChangePhaseDialogContext {
  /**
   * State of `ChangePhaseDialog`
   */
  state: IChangePhaseDialogState

  /**
   * Dispatches an action for `ChangePhaseDialog`
   */
  dispatch: React.Dispatch<AnyAction>

  /**
   * Next checklist item
   *
   * Updates the current checklist item, and dispatches `CHECKLIST_ITEM_UPDATED`
   * with the properties.
   *
   * @param properties Properties
   */
  nextChecklistItem: (properties: Record<string, any>) => Promise<void>
}

export const ChangePhaseDialogContext = createContext<IChangePhaseDialogContext>(null)
