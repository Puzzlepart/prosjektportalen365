import { IArchiveProgressStep } from './ArchiveProgress'

export interface IArchiveDialogProps {
  open: boolean
  webUrl: string
  onDismiss: () => void
  onArchived?: () => void
}

/**
 * The four steps of the archive wizard.
 */
export type ArchiveDialogView = 'selection' | 'confirm' | 'archiving' | 'completed'

/**
 * Progress for the two archive scopes (documents and lists), shown by
 * `ArchiveProgress` while archiving.
 */
export interface IArchiveProgressState {
  documents: IArchiveProgressStep
  lists: IArchiveProgressStep
}
