import { FileAddResult } from '@pnp/sp'
import { TemplateItem } from 'models/TemplateItem'
import { ICopyProgressScreenProps } from './CopyProgressScreen/types'

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
   * Screen to show
   */
  screen: DocumentTemplateDialogScreen

  /**
   * Selected templates
   */
  selected: TemplateItem[]

  /**
   * Progress
   */
  progress?: ICopyProgressScreenProps

  /**
   * Dialog is blocked and can not be closed
   */
  locked?: boolean

  /**
   * Target folder selected in TargetFolderScreen
   */
  targetFolder?: string

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
   * Target folder screen
   */
  TargetFolder,

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
  Summary,

  /**
   * Error screen
   */
  Error
}
