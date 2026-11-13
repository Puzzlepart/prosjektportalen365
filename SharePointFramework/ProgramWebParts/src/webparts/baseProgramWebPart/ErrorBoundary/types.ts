import { ReactNode } from 'react'

export interface IErrorBoundaryProps {
  /**
   * Called once when what the boundary holds fails to render. It is not given the error: the
   * base web part counts the failure by a code, and the message stays on the page.
   */
  onError: () => void

  /**
   * What the web part renders
   */
  children?: ReactNode
}

export interface IErrorBoundaryState {
  /**
   * The error that was thrown while rendering, once one was
   */
  error?: Error
}
