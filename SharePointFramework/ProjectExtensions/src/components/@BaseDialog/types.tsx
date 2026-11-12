import React from 'react'

/** Shared content and dismissal options for extension dialogs. */
export interface IBaseDialogProps {
  version?: string

  /** Falls back to the version string when omitted. */
  versionTooltip?: string

  title?: string

  subText?: string

  /** Disables backdrop dismissal and the close button, but not Escape. */
  isBlocking?: boolean

  containerClassName?: string

  contentClassName?: string

  footer?: React.ReactNode

  onDismiss?: () => void

  children?: React.ReactNode
}
