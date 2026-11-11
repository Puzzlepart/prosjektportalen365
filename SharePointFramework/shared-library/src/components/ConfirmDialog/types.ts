import React from 'react'

/** Value handed back when the user picks a response. */
export type ConfirmDialogResponseValue = boolean | string

/**
 * A single response button: its label, the value it resolves with, and whether
 * it is rendered as the primary action.
 */
export type ConfirmDialogResponse = [string, ConfirmDialogResponseValue?, boolean?]

export interface IConfirmDialogProps {
  /**
   * Title of the dialog.
   */
  title?: string

  /**
   * Body text, shown above any children.
   */
  subText?: string

  /**
   * The response buttons, rendered left to right.
   */
  responses: ConfirmDialogResponse[]

  /**
   * Extra content rendered below `subText`.
   */
  children?: React.ReactNode
}

/**
 * Return value of {@link useConfirmationDialog}: the element to render, and a
 * function that opens the dialog and resolves with the chosen response.
 */
export type UseConfirmationDialog = [
  JSX.Element,
  (props: IConfirmDialogProps) => Promise<ConfirmDialogResponseValue>
]
