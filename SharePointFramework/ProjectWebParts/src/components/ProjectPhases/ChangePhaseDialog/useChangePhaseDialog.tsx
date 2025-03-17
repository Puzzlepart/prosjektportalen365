import * as strings from 'ProjectWebPartsStrings'
import { useContext, useEffect } from 'react'
import SPDataAdapter from '../../../data'
import { ProjectPhasesContext } from '../context'
import { CHECKLIST_ITEM_UPDATED, INIT, useChangePhaseDialogReducer } from './reducer'

/**
 * Custom hook for managing the change phase dialog state and actions.
 */
export function useChangePhaseDialog() {
  const context = useContext(ProjectPhasesContext)
  const { state, dispatch } = useChangePhaseDialogReducer()

  useEffect(() => dispatch(INIT({ context })), [])

  /**
   * Next checklist item
   *
   * Updates the current checklist item, and dispatches CHECKLIST_ITEM_UPDATED
   * with the properties
   *
   * @param properties Properties
   */
  const nextChecklistItem = async (properties: Partial<Record<string, any>>): Promise<void> => {
    const currentItem = [...state.checklistItems][state.currentIdx]
    await SPDataAdapter.project.updateChecklistItem(
      strings.PhaseChecklistName,
      currentItem.id,
      properties
    )
    dispatch(CHECKLIST_ITEM_UPDATED({ properties }))
  }

  return { state, dispatch, nextChecklistItem }
}
