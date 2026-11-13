import React from 'react'

/**
 * Supported widths of the shared drawer.
 */
export type BasePanelSize = 'small' | 'medium' | 'large' | 'full'

/**
 * Configures a shared drawer and its header, body and dismissal behavior.
 */
export interface IBasePanelProps<T extends string = string> {
  className?: string

  /**
   * Caller-side panel discriminator; the drawer's visibility is controlled only by open.
   */
  $type?: T

  open?: boolean

  /**
   * Called when the panel should close, whether from the close button, a click
   * outside or the Escape key.
   */
  onClose?: () => void

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

  closeButtonAriaLabel?: string

  /**
   * Hides the panel's header, with the title or `header` content and the
   * close button, through the `hidden` attribute. The body and footer still
   * render, and only `open` decides whether the panel shows: without the close
   * button it closes on Escape, a click outside (`isLightDismiss`) or the
   * caller's own buttons.
   */
  hidden?: boolean

  /**
   * Actions shown in the header under the title, outside the heading: in `header` they were
   * inside the `h2` that names the panel, which was then named by its buttons («BrukTilbakestill
   * rekkefølge»), and the real title was a second heading in the body (WCAG 1.3.1, 4.1.2).
   */
  headerActions?: React.ReactNode

  /**
   * Header content shown in place of `headerText`. It is the panel's heading and name: actions
   * go in `headerActions`.
   */
  header?: React.ReactNode

  /**
   * Content pinned to the bottom of the panel, typically its save and cancel
   * buttons.
   */
  footer?: React.ReactNode

  /**
   * Makes the body a stop for the keyboard, a region named by `headerText`, for a panel whose
   * content is read rather than worked in: the body scrolls, and with no focusable element in it
   * the keyboard could not scroll it (WCAG 2.1.1; axe's `scrollable-region-focusable`). A panel of
   * fields leaves it off, its fields being its stops.
   */
  isBodyFocusable?: boolean

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
