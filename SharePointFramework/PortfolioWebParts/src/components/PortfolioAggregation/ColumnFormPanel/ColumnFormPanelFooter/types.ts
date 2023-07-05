import { useColumnFormPanel } from '../useColumnFormPanel'

export type ColumnFormPanelFooterProps =Pick<
    ReturnType<typeof useColumnFormPanel>,
    'onSave' | 'onDeleteColumn' | 'isEditing' | 'isSaveDisabled' | 'isDeleteDisabled'
  > 
