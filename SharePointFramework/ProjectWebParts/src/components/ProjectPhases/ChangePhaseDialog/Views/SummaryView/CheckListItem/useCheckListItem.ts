import { stringIsNullOrEmpty } from '@pnp/core'
import * as strings from 'ProjectWebPartsStrings'
import { useId } from '@fluentui/react-components'
import { useState } from 'react'
import { STATUS_COLORS } from './types'
import { ChecklistItemModel, getFluentIcon } from 'pp365-shared-library'

/** Derives a checkpoint status icon and controls its expandable comment. */
export function useCheckListItem(item: ChecklistItemModel) {
  const [commentHidden, setCommentHidden] = useState(true)
  const commentId = useId('checklist-item-comment')
  const hasComment = !stringIsNullOrEmpty(item.comment)

  const statusIcon = getFluentIcon(
    item.status === strings.StatusOpen
      ? 'Circle'
      : item.status === strings.StatusClosed
        ? 'CheckmarkCircle'
        : 'DismissCircle',
    { color: STATUS_COLORS[item.status], size: 24 }
  )

  return { commentHidden, setCommentHidden, hasComment, statusIcon, commentId }
}
