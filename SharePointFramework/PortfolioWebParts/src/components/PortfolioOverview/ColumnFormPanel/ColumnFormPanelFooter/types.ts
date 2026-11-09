export interface IColumnFormPanelFooterProps {
  onSave: () => Promise<void>
  onDeleteColumn: () => Promise<void>
  isEditing: boolean
  isSaveDisabled: boolean

  /**
   * Why save is disabled, when it is not that the form is incomplete.
   */
  saveDisabledReason?: string
}
