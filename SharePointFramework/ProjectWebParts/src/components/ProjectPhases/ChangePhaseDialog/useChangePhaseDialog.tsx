import { useContext } from 'react'
import SPDataAdapter from '../../../data'
import { ProjectPhasesContext } from '../context'
import { CHECKLIST_ITEM_SAVED } from '../reducer'
import { CHECKLIST_ITEM_UPDATED, useChangePhaseDialogReducer } from './reducer'
import resource from 'SharedResources'

/** Connects phase-change dialog state to checkpoint saves on the project and phase selector. */
export function useChangePhaseDialog() {
  const context = useContext(ProjectPhasesContext)
  const { state, dispatch } = useChangePhaseDialogReducer(context)

  /**
   * Saves the current checkpoint and updates both the dialog and loaded phase state.
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
