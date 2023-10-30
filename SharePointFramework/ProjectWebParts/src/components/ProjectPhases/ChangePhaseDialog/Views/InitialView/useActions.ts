import { ProjectPhasesContext } from 'components/ProjectPhases/context'
import { getFluentIcon } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'

/**
 * Use actions hook
 *
 * @param comment Comment value
 * @param onNextChecklistItem On next checklist item callback
 */
export function useActions(comment: string, onNextChecklistItem: (statusValue: string) => void) {
  const context = useContext(ProjectPhasesContext)
  const isCommentValid = comment?.length >= context.props.commentMinLength
  const actions = [
    {
      text: strings.StatusNotRelevant,
      disabled: !isCommentValid,
      title: isCommentValid
        ? strings.CheckpointNotRelevantTooltip
        : strings.CheckpointNotRelevantTooltipCommentEmpty,
      onClick: () => onNextChecklistItem(strings.StatusNotRelevant),
      icon: getFluentIcon('DismissCircle')
    },
    {
      text: strings.StatusStillOpen,
      disabled: !isCommentValid,
      title: isCommentValid
        ? strings.CheckpointStillOpenTooltip
        : strings.CheckpointStillOpenTooltipCommentEmpty,
      onClick: () => onNextChecklistItem(strings.StatusOpen),
      icon: getFluentIcon('Circle')
    },
    {
      text: strings.StatusClosed,
      title: strings.CheckpointDoneTooltip,
      onClick: () => onNextChecklistItem(strings.StatusClosed),
      icon: getFluentIcon('CheckmarkCircle')
    }
  ]
  return actions
}
