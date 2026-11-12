import { useColumnFormPanel } from '../useColumnFormPanel'

/** Column save/delete actions and explanations for unavailable operations. */
export type ColumnFormPanelFooterProps = Pick<
  ReturnType<typeof useColumnFormPanel>,
  'onSave' | 'onDeleteColumn' | 'isEditing' | 'isSaveDisabled' | 'isDeleteDisabled'
> & {
  /**
   * Why save is disabled, when it is not that the form is incomplete.
   */
  saveDisabledReason?: string

  /**
   * Why the column cannot be deleted.
   */
  deleteDisabledReason?: string
}
