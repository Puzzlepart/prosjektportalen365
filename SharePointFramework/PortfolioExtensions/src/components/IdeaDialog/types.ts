export interface IIdeaDialogProps {
  close: () => void
  submit: () => void
  ideaTitle?: string
  dialogMessage?: string
  isBlocked?: boolean
}
