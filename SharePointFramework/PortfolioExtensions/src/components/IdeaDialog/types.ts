/** Approval/link state, message and callbacks for project-data confirmation. */
export interface IIdeaDialogProps {
  onClose: () => void
  onSubmit: () => void
  ideaTitle?: string
  dialogMessage?: string
  isBlocked?: boolean
  isApproved?: boolean
  /** Why the project data was not created, shown as an error while the dialog stays open */
  errorMessage?: string
}
