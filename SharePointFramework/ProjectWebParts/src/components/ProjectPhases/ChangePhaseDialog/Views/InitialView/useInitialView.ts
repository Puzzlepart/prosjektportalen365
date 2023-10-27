import { useContext, useState } from 'react'
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

  const actions = useActions(comment, onNextChecklistItem)

  return { checklistItem, checklistItems, setComment, comment, actions } as const
}
