/** Column save/delete actions and explanations for unavailable operations. */
export interface IColumnFormPanelFooterProps {
  onSave: () => Promise<void>
  onDeleteColumn: () => Promise<void>
  isEditing: boolean
  isSaveDisabled: boolean

  /**
   * Why save is disabled, when it is not that the form is incomplete.
   */
  saveDisabledReason?: string

  /**
   * Whether the column cannot be deleted.
   */
  isDeleteDisabled?: boolean

  /**
   * Why the column cannot be deleted.
   */
  deleteDisabledReason?: string
}
