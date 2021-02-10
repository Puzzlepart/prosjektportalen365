
export interface IDocumentTemplateDialogDismissProps {
  reload?: boolean
}

export interface IDocumentTemplateDialogProps {
  /**
   * Title
   */
  title: string

  /**
   * On dismiss callback
   */
  onDismiss: (props: IDocumentTemplateDialogDismissProps) => void
}

export enum DocumentTemplateDialogScreen {
  /**
   * Select screen
   */
  Select,

  /**
   * Edit copy screen
   */
  EditCopy,

  /**
   * Copy progess screen
   */
  CopyProgress,

  /**
   * Summary scren
   */
  Summary
}
