export interface IFooterProps {
  /**
   * On save callback.
   */
  onSave: () => void

  /**
   * On cancel callback.
   */
  closePanel: () => void

  /**
   * Whether the save button should be disabled.
   */
  isSaveDisabled: boolean
}
