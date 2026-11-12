import { UnknownAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IChangePhaseDialogState } from './types'

/** Current phase-change step, checkpoint state and update handler. */
export interface IChangePhaseDialogContext {
  /**
   * State of `ChangePhaseDialog`
   */
  state: IChangePhaseDialogState

  /**
   * Dispatches an action for `ChangePhaseDialog`
   */
  dispatch: React.Dispatch<UnknownAction>

  /**
   * Next checklist item
   *
   * Updates the current checklist item, and dispatches `CHECKLIST_ITEM_UPDATED`
   * with the properties.
   *
   */
  nextChecklistItem: (properties: Record<string, any>) => Promise<void>
}

/** Shares checkpoint progress and archive choices between dialog steps. */
export const ChangePhaseDialogContext = createContext<IChangePhaseDialogContext>(null)
