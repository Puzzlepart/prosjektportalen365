export interface IIdeaApprovalDialogProps {
  close: () => void
  submit: (choice: string, comment: string) => void
  ideaTitle?: string
  dialogMessage?: string
  choices: { key: string; choice: string }[]
}

export interface IIdeaApprovalDialogState {
  choice: string
  comment: string
}
