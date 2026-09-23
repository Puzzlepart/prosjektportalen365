import React from 'react'

/**
 * Size of the panel. Kept as the two values the repository actually used from
 * the Fluent UI v8 `PanelType`, mapped onto the Fluent UI v9 drawer sizes.
 */
export type BasePanelSize = 'small' | 'medium' | 'large' | 'full'

export interface IBasePanelProps<T extends string = string> {
  /**
   * Class name applied to the drawer.
   */
  className?: string

  /**
   * The type of the panel. Used for deciding if the
   * panel should be open or not.
   */
  $type?: T

  /**
   * Whether the panel is open.
   */
  isOpen?: boolean

  /**
   * Called when the panel should close, whether from the close button, a click
   * outside or the Escape key.
   */
  onDismiss?: () => void

  /**
   * Text shown in the panel header.
   */
  headerText?: string

  /**
   * Width of the panel. Defaults to `medium`.
   */
  size?: BasePanelSize

  /**
   * Which edge the panel slides in from. Defaults to `end`, the right-hand
   * side, which is where the v8 `Panel` always opened and where the other
   * drawers in the solutions open.
   */
  position?: 'start' | 'end' | 'bottom'

  /**
   * Whether a click outside the panel closes it. Defaults to `true`.
   */
  isLightDismiss?: boolean

  /**
   * Accessible name for the close button.
   */
  closeButtonAriaLabel?: string

  /**
   * Hides the panel without unmounting it.
   */
  hidden?: boolean

  /**
   * Renders the panel header in place of `headerText`, for panels whose header
   * carries actions rather than a title.
   */
  onRenderHeader?: () => React.ReactNode

  /**
   * Renders the panel body. Kept as a render prop because that is how the v8
   * `Panel` was used across the solutions; `children` works too.
   */
  onRenderBody?: () => React.ReactNode

  /**
   * Renders the panel footer.
   */
  onRenderFooterContent?: () => React.ReactNode

  children?: React.ReactNode
}
