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
  open?: boolean

  /**
   * Called when the panel should close, whether from the close button, a click
   * outside or the Escape key.
   */
  onClose?: () => void

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
   * Header content shown in place of `headerText`, for panels whose header
   * carries actions rather than a title.
   */
  header?: React.ReactNode

  /**
   * Content pinned to the bottom of the panel, typically its save and cancel
   * buttons.
   */
  footer?: React.ReactNode

  children?: React.ReactNode

  /**
   * Renamed to `open`. Declared as `never` rather than removed because several
   * call sites build a props object and hand it to a component that spreads it;
   * a spread is not excess-property-checked, so a leftover `isOpen` there would
   * otherwise compile and silently leave the panel shut.
   *
   * @deprecated Use `open`.
   */
  isOpen?: never

  /**
   * Renamed to `onClose`. `never` for the same reason as `isOpen`.
   *
   * @deprecated Use `onClose`.
   */
  onDismiss?: never
}
