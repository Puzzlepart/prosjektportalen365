export interface IIdeaDialogProps {
  onClose: () => void
  onSubmit: () => void
  ideaTitle?: string
  dialogMessage?: string
  isBlocked?: boolean
  isApproved?: boolean
}
