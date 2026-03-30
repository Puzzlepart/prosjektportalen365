import React from 'react'

export interface IBaseDialogProps {
  /**
   * Version from extension manifest
   */
  version?: string

  /**
   * Tooltip text for the version badge. Falls back to `version` if not specified.
   */
  versionTooltip?: string

  /**
   * Dialog title
   */
  title?: string

  /**
   * Dialog subtitle / description text
   */
  subText?: string

  /**
   * Whether the dialog is blocking (no dismiss on backdrop click, no close button)
   */
  isBlocking?: boolean

  /**
   * Additional class name for the DialogSurface container
   */
  containerClassName?: string

  /**
   * Additional class name for the DialogContent area
   */
  contentClassName?: string

  /**
   * Footer content rendered in DialogActions
   */
  footer?: React.ReactNode

  /**
   * On dismiss callback
   */
  onDismiss?: () => void

  /**
   * Dialog children rendered in DialogContent
   */
  children?: React.ReactNode
}
