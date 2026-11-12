/** Idea details, available decisions and callbacks for the recommendation form. */
export interface IIdeaApprovalDialogProps {
  onClose: () => void
  onSubmit: (choice: string, comment: string) => void
  ideaTitle?: string
  dialogMessage?: string
  choices: Choice[]
}

/** Decision text and comment currently entered in the recommendation form. */
export interface IIdeaApprovalDialogState {
  choice: string
  comment: string
}

/** Configured decision identifier and its displayed text. */
export interface Choice {
  key: string
  choice: string
}
