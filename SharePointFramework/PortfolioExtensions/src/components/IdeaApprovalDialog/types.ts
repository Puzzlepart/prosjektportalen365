export interface IIdeaApprovalDialogProps {
  close: () => void
  submit: (choice: string, comment: string) => void
  ideaTitle?: string
  dialogMessage?: string
}

export interface IIdeaApprovalDialogState {
  choice: string
  comment: string
}
