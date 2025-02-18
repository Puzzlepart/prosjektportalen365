import { ProjectPhasesContext } from 'components/ProjectPhases/context'
import { getFluentIcon } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { useBoolean } from 'usehooks-ts'

/**
 * Use actions hook
 *
 * @param comment Comment value
 * @param onNextChecklistItem On next checklist item callback
 */
export function useActions(comment: string, onNextChecklistItem: (statusValue: string) => Promise<void>) {
  const context = useContext(ProjectPhasesContext)
  const isCommentValid = comment?.length >= context.props.commentMinLength
  const isDisabled = useBoolean(false)
  const actions = [
    {
      text: strings.StatusNotRelevant,
      disabled: !isCommentValid || isDisabled.value,
      title: isCommentValid
        ? strings.CheckpointNotRelevantTooltip
        : strings.CheckpointNotRelevantTooltipCommentEmpty,
      onClick: () => {
        isDisabled.setTrue()
        onNextChecklistItem(strings.StatusNotRelevant).then(isDisabled.setFalse)
      },
      icon: getFluentIcon('DismissCircle')
    },
    {
      text: strings.StatusStillOpen,
      disabled: !isCommentValid || isDisabled.value,
      title: isCommentValid
        ? strings.CheckpointStillOpenTooltip
        : strings.CheckpointStillOpenTooltipCommentEmpty,
      onClick: () => {
        isDisabled.setTrue()
        onNextChecklistItem(strings.StatusStillOpen).then(isDisabled.setFalse)
      },
      icon: getFluentIcon('Circle')
    },
    {
      text: strings.StatusClosed,
      disabled: isDisabled.value,
      title: strings.CheckpointDoneTooltip,
      onClick: () => {
        isDisabled.setTrue()
        onNextChecklistItem(strings.StatusClosed).then(isDisabled.setFalse)
      },
      icon: getFluentIcon('CheckmarkCircle')
    }
  ]
  return actions
}
