import { useContext } from 'react'
import SPDataAdapter from '../../../data'
import { ProjectPhasesContext } from '../context'
import { CHECKLIST_ITEM_SAVED } from '../reducer'
import { CHECKLIST_ITEM_UPDATED, useChangePhaseDialogReducer } from './reducer'
import resource from 'SharedResources'

/**
 * Custom hook for managing the change phase dialog state and actions.
 */
export function useChangePhaseDialog() {
  const context = useContext(ProjectPhasesContext)
  const { state, dispatch } = useChangePhaseDialogReducer(context)

  /**
   * Next checklist item
   *
   * Updates the current checklist item, and dispatches CHECKLIST_ITEM_UPDATED
   * with the properties, and the saved item to the phases (CHECKLIST_ITEM_SAVED), so that the
   * dialog opened next starts from it
   *
   * @param properties Properties
   */
  const nextChecklistItem = async (properties: Partial<Record<string, any>>): Promise<void> => {
    const currentItem = [...state.checklistItems][state.currentIdx]
    await SPDataAdapter.project.updateChecklistItem(
      resource.Lists_PhaseChecklist_Title,
      currentItem.id,
      properties
    )
    dispatch(CHECKLIST_ITEM_UPDATED({ properties }))
    context.dispatch(CHECKLIST_ITEM_SAVED({ item: currentItem.update(properties) }))
  }

  return { state, dispatch, nextChecklistItem }
}
