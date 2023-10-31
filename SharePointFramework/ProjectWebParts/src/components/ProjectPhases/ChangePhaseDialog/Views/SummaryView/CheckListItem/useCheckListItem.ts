import { stringIsNullOrEmpty } from '@pnp/core'
import * as strings from 'ProjectWebPartsStrings'
import { useState } from 'react'
import { STATUS_COLORS } from './types'
import { ChecklistItemModel, getFluentIcon } from 'pp365-shared-library'

/**
 * Custom hook for managing a checklist item.
 *
 * @param item - The checklist item to manage.
 *
 * @returns An object containing the state and functions for managing the checklist item.
 */
export function useCheckListItem(item: ChecklistItemModel) {
  const [commentHidden, setCommentHidden] = useState(true)
  const hasComment = !stringIsNullOrEmpty(item.comment)

  const statusIcon = getFluentIcon(
    item.status === strings.StatusOpen
      ? 'Circle'
      : item.status === strings.StatusClosed
      ? 'CheckmarkCircle'
      : 'DismissCircle',
    { color: STATUS_COLORS[item.status], size: 24 }
  )

  return { commentHidden, setCommentHidden, hasComment, statusIcon }
}
