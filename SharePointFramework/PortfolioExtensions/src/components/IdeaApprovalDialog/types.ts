export interface IIdeaApprovalDialogProps {
  onClose: () => void
  onSubmit: (choice: string, comment: string) => void
  ideaTitle?: string
  dialogMessage?: string
  choices: Choice[]
}

export interface IIdeaApprovalDialogState {
  choice: string
  comment: string
}

export interface Choice {
  key: string
  choice: string
}
