export interface IIdeaDialogProps {
  close: () => void
  submit: () => void
  ideaTitle?: string
  dialogDescription?: string
  isBlocked?: boolean
}
