import { IFileInfo } from '@pnp/sp/files'
import { TemplateItem } from 'models/TemplateItem'
import { SPFolder } from 'pp365-shared-library'
import { ICopyProgressScreenProps } from './CopyProgressScreen/types'

/** Indicates whether closing the dialog should refresh the document library. */
export interface IDocumentTemplateDialogDismissProps {
  reload?: boolean
}

/** Title and dismissal handling for the document-template wizard. */
export interface IDocumentTemplateDialogProps {
  title: string

  onDismiss: (props: IDocumentTemplateDialogDismissProps) => void
}

/** Target-folder navigation and row selection, retained when switching screens. */
export interface IDocumentTemplateDialogBrowse {
  library?: SPFolder

  /** Server-relative folder URL, or an empty string for the library root. */
  folder: string

  libraries: boolean

  /** Row selection is separate from the folder currently open. */
  selectedFolder?: string
}

/** Wizard navigation, template selection, copy progress and results. */
export interface IDocumentTemplateDialogState {
  screen: DocumentTemplateDialogScreen

  selected: TemplateItem[]

  progress?: ICopyProgressScreenProps

  /** Suppresses the close button and backdrop dismissal while copying. */
  locked?: boolean

  targetFolder?: string

  uploaded?: IFileInfo[]

  browse: IDocumentTemplateDialogBrowse
}

/** Steps of the document-template copy wizard. */
export enum DocumentTemplateDialogScreen {
  Select,

  TargetFolder,

  EditCopy,

  CopyProgress,

  Summary
}
