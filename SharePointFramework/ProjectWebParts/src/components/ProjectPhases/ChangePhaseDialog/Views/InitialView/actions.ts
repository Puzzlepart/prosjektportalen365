import { stringIsNullOrEmpty } from '@pnp/common'
import { IButtonProps } from 'office-ui-fabric-react/lib/Button'
import * as strings from 'ProjectWebPartsStrings'

/**
 * Get actions
 * 
 * @param {string} commtent Comment value
 * @param {void} onNextChecklistItem On next checklist item callback
 */
export default  (comment: string, onNextChecklistItem: (statusValue: string) =>  void) => {
    const isCommentValid = !stringIsNullOrEmpty(comment) && comment.length >= 4
    const actions: IButtonProps[] = [
      {
        text: strings.StatusNotRelevant,
        disabled: !isCommentValid,
        title: isCommentValid
          ? strings.CheckpointNotRelevantTooltip
          : strings.CheckpointNotRelevantTooltipCommentEmpty,
        onClick: () => onNextChecklistItem(strings.StatusNotRelevant)
      },
      {
        text: strings.StatusStillOpen,
        disabled: !isCommentValid,
        title: isCommentValid
          ? strings.CheckpointStillOpenTooltip
          : strings.CheckpointStillOpenTooltipCommentEmpty,
        onClick: () => onNextChecklistItem(strings.StatusOpen)
      },
      {
        text: strings.StatusClosed,
        title: strings.CheckpointDoneTooltip,
        onClick: () => onNextChecklistItem(strings.StatusClosed),
      }
    ]
    return actions
}