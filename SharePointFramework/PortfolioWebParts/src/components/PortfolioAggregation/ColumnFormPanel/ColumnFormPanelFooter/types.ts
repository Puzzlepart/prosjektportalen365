import { useColumnFormPanel } from '../useColumnFormPanel'

export type ColumnFormPanelFooterProps = Pick<
  ReturnType<typeof useColumnFormPanel>,
  'onSave' | 'onDeleteColumn' | 'isEditing' | 'isSaveDisabled' | 'isDeleteDisabled'
> & {
  /**
   * Why save is disabled, when it is not that the form is incomplete.
   */
  saveDisabledReason?: string

  /**
   * Why delete is disabled, when it is not the title column.
   */
  deleteDisabledReason?: string
}
