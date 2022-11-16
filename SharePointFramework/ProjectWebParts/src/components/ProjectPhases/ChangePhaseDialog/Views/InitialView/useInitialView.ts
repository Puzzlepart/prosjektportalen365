import { ProjectPhasesContext } from '../../../context'
import { useContext, useState } from 'react'
import { ChangePhaseDialogContext } from '../../context'
import { getActions } from './actions'

/**
 * Component logic hook for `InitialView`
 */
export function useInitialView() {
  const context = useContext(ProjectPhasesContext)
  const { state } = useContext(ChangePhaseDialogContext)
  const checklistItem = state.checklistItems[state.currentIdx]
  const { nextChecklistItem } = useContext(ChangePhaseDialogContext)
  const [comment, setComment] = useState(checklistItem.comment || '')

  /**
   * On next check list item
   *
   * @param statusValue Status value
   */
  const onNextChecklistItem = (statusValue: string) => {
    nextChecklistItem({
      GtChecklistStatus: statusValue,
      GtComment: comment
    })
    setComment('')
  }

  const actions = getActions(comment, onNextChecklistItem, context.props.commentMinLength)

  return { checklistItem, setComment, comment, actions } as const
}
