import { ChecklistItemModel } from 'pp365-shared-library/lib/models'
import strings from 'ProjectWebPartsStrings'

export default interface IChecklistItemProps {
  item: ChecklistItemModel
}

export const STATUS_COLORS = {
  [strings.StatusOpen]: 'inherit',
  [strings.StatusClosed]: '#107c10',
  [strings.StatusNotRelevant]: '#e81123'
}

export const STATUS_ICONS = {
  [strings.StatusOpen]: 'CircleRing',
  [strings.StatusClosed]: 'Completed',
  [strings.StatusNotRelevant]: 'Blocked'
}
