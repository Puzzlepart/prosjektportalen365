import { IArchiveProgressStep } from './ArchiveProgress'

/**
 * Props for {@link ArchiveDialog}.
 */
export interface IArchiveDialogProps {
  open: boolean
  /** URL of the project web whose documents/lists are archived. */
  webUrl: string
  onDismiss: () => void
  /** Called after the archive run finishes (used to refresh the archive status). */
  onArchived?: () => void
}

/**
 * The four steps of the archive wizard.
 */
export type ArchiveDialogView = 'selection' | 'confirm' | 'archiving' | 'completed'

/**
 * Progress for the two archive scopes (documents and lists) plus the terminal
 * status of the run, shown by `ArchiveProgress` while and after archiving.
 */
export interface IArchiveProgressState {
  documents: IArchiveProgressStep
  lists: IArchiveProgressStep
  /** `running` until the run finishes; `error` when one or more items failed. */
  status: 'running' | 'success' | 'error'
}
