import { ProjectPhasesContext } from 'components/ProjectPhases/context'
import { format, getFluentIcon } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { useBoolean } from 'usehooks-ts'

/**
 * Use actions hook
 *
 * @param comment Comment value
 * @param onNextChecklistItem On next checklist item callback
 */
export function useActions(
  comment: string,
  onNextChecklistItem: (statusValue: string) => Promise<void>
) {
  const { commentMinLength } = useContext(ProjectPhasesContext).props
  const isCommentValid = comment?.length >= commentMinLength
  const isDisabled = useBoolean(false)
  const actions = [
    {
      text: strings.StatusNotRelevant,
      // Focusable while unavailable, so the keyboard and a screen reader reach the reason in the
      // title, and the focus stays on the button while the status is saved.
      disabledFocusable: !isCommentValid || isDisabled.value,
      title: isCommentValid
        ? strings.CheckpointNotRelevantTooltip
        : format(strings.CheckpointNotRelevantTooltipCommentEmpty, commentMinLength),
      onClick: () => {
        isDisabled.setTrue()
        void onNextChecklistItem(strings.StatusNotRelevant).then(isDisabled.setFalse)
      },
      icon: getFluentIcon('DismissCircle')
    },
    {
      text: strings.StatusStillOpen,
      disabledFocusable: !isCommentValid || isDisabled.value,
      title: isCommentValid
        ? strings.CheckpointStillOpenTooltip
        : format(strings.CheckpointStillOpenTooltipCommentEmpty, commentMinLength),
      onClick: () => {
        isDisabled.setTrue()
        void onNextChecklistItem(strings.StatusStillOpen).then(isDisabled.setFalse)
      },
      icon: getFluentIcon('Circle')
    },
    {
      text: strings.StatusClosed,
      disabledFocusable: isDisabled.value,
      title: strings.CheckpointDoneTooltip,
      onClick: () => {
        isDisabled.setTrue()
        void onNextChecklistItem(strings.StatusClosed).then(isDisabled.setFalse)
      },
      icon: getFluentIcon('CheckmarkCircle')
    }
  ]
  return actions
}
