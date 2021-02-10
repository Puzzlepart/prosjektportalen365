import { AnyAction } from '@reduxjs/toolkit'
import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import { createContext } from 'react'
import { IChangePhaseDialogState } from './types'

export interface IChangePhaseDialogContext {
  /**
   * State
   */
  state: IChangePhaseDialogState

  /**
   * Dispatches an action for ChangePhaseDialog
   */
  dispatch: React.Dispatch<AnyAction>

  /**
   * Next checklist item
   *
   * Updates the current checklist item, and dispatches CHECKLIST_ITEM_UPDATED
   * with the properties
   *
   * @param {Partial<IProjectPhaseChecklistItem>} properties Properties
   */
  nextChecklistItem: (properties: Partial<IProjectPhaseChecklistItem>) => void
}

export const ChangePhaseDialogContext = createContext<IChangePhaseDialogContext>(null)
