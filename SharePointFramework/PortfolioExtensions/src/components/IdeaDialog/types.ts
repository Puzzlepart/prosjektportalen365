/** Approval/link state, message and callbacks for project-data confirmation. */
export interface IIdeaDialogProps {
  onClose: () => void
  onSubmit: () => void
  ideaTitle?: string
  dialogMessage?: string
  isBlocked?: boolean
  isApproved?: boolean
}
