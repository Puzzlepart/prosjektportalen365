import { IButtonProps } from '@fluentui/react/lib/Button'
import * as strings from 'ProjectWebPartsStrings'

/**
 * Get actions
 *
 * @param comment Comment value
 * @param onNextChecklistItem On next checklist item callbac
 * @param commentMinLength Comment min length
 */
export function getActions(
  comment: string,
  onNextChecklistItem: (statusValue: string) => void,
  commentMinLength: number
) {
  const isCommentValid = comment?.length >= commentMinLength
  const actions: IButtonProps[] = [
    {
      text: strings.StatusNotRelevant,
      disabled: !isCommentValid,
      title: isCommentValid
        ? strings.CheckpointNotRelevantTooltip
        : strings.CheckpointNotRelevantTooltipCommentEmpty,
      onClick: () => onNextChecklistItem(strings.StatusNotRelevant),
      iconProps: { iconName: 'Blocked' }
    },
    {
      text: strings.StatusStillOpen,
      disabled: !isCommentValid,
      title: isCommentValid
        ? strings.CheckpointStillOpenTooltip
        : strings.CheckpointStillOpenTooltipCommentEmpty,
      onClick: () => onNextChecklistItem(strings.StatusOpen),
      iconProps: { iconName: 'CircleRing' }
    },
    {
      text: strings.StatusClosed,
      title: strings.CheckpointDoneTooltip,
      onClick: () => onNextChecklistItem(strings.StatusClosed),
      iconProps: { iconName: 'CheckMark' }
    }
  ]
  return actions
}
