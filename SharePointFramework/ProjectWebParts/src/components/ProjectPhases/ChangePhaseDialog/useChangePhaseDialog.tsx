import { useId } from '@fluentui/react-components'
import { useFocusContentOnOpen } from 'pp365-shared-library'
import { useContext } from 'react'
import SPDataAdapter from '../../../data'
import { ProjectPhasesContext } from '../context'
import { CHECKLIST_ITEM_SAVED } from '../reducer'
import { CHECKLIST_ITEM_UPDATED, useChangePhaseDialogReducer } from './reducer'
import resource from 'SharedResources'

/**
 * Connects phase-change dialog state to checkpoint saves on the project and phase selector, and
 * gives the ids of the texts that describe the dialog: the subtitle («Dette vil medføre endring fra
 * Planlegge til Gjennomføre fasen»), and in the confirmation the question as well.
 */
export function useChangePhaseDialog() {
  const context = useContext(ProjectPhasesContext)
  const { state, dispatch } = useChangePhaseDialogReducer(context)
  const subtitleId = useId('change-phase-subtitle')
  const confirmTextId = useId('change-phase-confirm')
  // It opens with the focus on itself, described by its subtitle: a screen reader reads the title
  // and what the change does first, and Tab goes on to the checkpoint or the answers
  // (Puzzlepart/prosjektportalen365-testing#132).
  const focusContent = useFocusContentOnOpen(!!context.state.confirmPhase)

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

  return { state, dispatch, nextChecklistItem, subtitleId, confirmTextId, focusContent }
}
