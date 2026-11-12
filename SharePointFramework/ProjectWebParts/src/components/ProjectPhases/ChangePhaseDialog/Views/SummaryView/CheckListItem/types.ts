import { ChecklistItemModel } from 'pp365-shared-library/lib/models'
import strings from 'ProjectWebPartsStrings'

/** Checkpoint shown in the phase-change summary. */
export default interface IChecklistItemProps {
  item: ChecklistItemModel
}

/** Colors used to distinguish checkpoint status values. */
export const STATUS_COLORS = {
  [strings.StatusOpen]: 'inherit',
  [strings.StatusClosed]: '#107c10',
  [strings.StatusNotRelevant]: '#e81123'
}
