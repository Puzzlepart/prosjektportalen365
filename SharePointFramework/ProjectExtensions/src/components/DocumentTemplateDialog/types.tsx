import { TemplateItem, IDocumentLibrary } from '../../models'

export interface IDocumentTemplateDialogDismissProps {
  reload?: boolean
}

export interface IDocumentTemplateDialogProps {
  /**
   * Title
   */
  title: string

  /**
   * Templates
   */
  templates: TemplateItem[]

  /**
   * Libraries
   */
  libraries: IDocumentLibrary[]

  /**
   * Template library
   */
  templateLibrary: { title: string; url: string }

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
