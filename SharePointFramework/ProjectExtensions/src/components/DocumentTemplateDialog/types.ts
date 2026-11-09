import { IFileInfo } from '@pnp/sp/files'
import { TemplateItem } from 'models/TemplateItem'
import { SPFolder } from 'pp365-shared-library'
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

/**
 * Where the target folder screen is: the library browsed, the folder open in it, and a folder
 * picked by its row. The dialog keeps it, so its footer knows what «Kopier hit» means, and the
 * screen shows the same place when the user comes back to it.
 */
export interface IDocumentTemplateDialogBrowse {
  /**
   * The library whose folders are listed.
   */
  library?: SPFolder

  /**
   * The folder open in the library: its server relative URL, or an empty string for the
   * library's root.
   */
  folder: string

  /**
   * Whether the site's libraries are listed instead of the library's folders, which the screen
   * offers when the site has more than one.
   */
  libraries: boolean

  /**
   * A folder picked by selecting its row, without entering it.
   */
  selectedFolder?: string
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
   * Uploaded files
   */
  uploaded?: IFileInfo[]

  /**
   * Where the target folder screen is browsing.
   */
  browse: IDocumentTemplateDialogBrowse
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
  Summary
}
