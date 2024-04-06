export interface IIdeaDialogProps {
  close: () => void
  submit: () => void
  ideaTitle?: string
  dialogMessage?: string
  choices: { key: string; choice: string }[]
  isBlocked?: boolean
  isApproved?: boolean
}
