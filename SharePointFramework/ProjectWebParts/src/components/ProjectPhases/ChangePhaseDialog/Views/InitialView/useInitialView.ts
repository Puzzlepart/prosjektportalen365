import { useContext, useState } from 'react'
import { format } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { ProjectPhasesContext } from 'components/ProjectPhases/context'
import { ChangePhaseDialogContext } from '../../context'
import { useActions } from './useActions'

/**
 * Component logic hook for `InitialView`
 */
export function useInitialView() {
  const { state } = useContext(ChangePhaseDialogContext)
  const checklistItem = state.checklistItems[state.currentIdx]
  const checklistItems = state.checklistItems
  const { nextChecklistItem } = useContext(ChangePhaseDialogContext)
  const { commentMinLength } = useContext(ProjectPhasesContext).props
  const commentHint =
    commentMinLength > 0 ? format(strings.ChecklistCommentDescription, commentMinLength) : undefined
  const [comment, setComment] = useState(checklistItem.comment || '')

  /**
   * On next check list item
   *
   * @param statusValue Status value
   */
  const onNextChecklistItem = async (statusValue: string) => {
    await nextChecklistItem({
      GtChecklistStatus: statusValue,
      GtComment: comment
    })
    setComment('')
  }

  const actions = useActions(comment, onNextChecklistItem)

  return {
    checklistItem,
    checklistItems,
    setComment,
    comment,
    commentHint,
    actions
  } as const
}
