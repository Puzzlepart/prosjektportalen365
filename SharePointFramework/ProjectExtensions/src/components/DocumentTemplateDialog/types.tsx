import { FileAddResult } from '@pnp/sp'
import { TemplateItem } from 'models/TemplateItem'
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator'

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

export interface IDocumentTemplateDialogState {
  /**
   * Screen
   */
  screen: DocumentTemplateDialogScreen

  /**
   * Selected templates
   */
  selected: TemplateItem[]

  /**
   * Progress
   */
  progress?: IProgressIndicatorProps

  /**
   * Is blocking
   */
  isBlocking?: boolean

  /**
   * Uploaded
   */
  uploaded?: FileAddResult[]
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
