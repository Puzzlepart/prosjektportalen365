export interface IColumnFormPanelFooterProps {
    onSave: () => Promise<void>
    onDeleteColumn: () => Promise<void>
    isEditing: boolean
    isSaveDisabled: boolean
}
