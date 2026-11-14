import { createCustomFocusIndicatorStyle, makeStyles, tokens } from '@fluentui/react-components'
import { RefObject, useEffect, useRef } from 'react'

const useStyles = makeStyles({
  // A ring on the surface itself while the keyboard has put the focus there, as on a control.
  content: createCustomFocusIndicatorStyle({
    outlineWidth: tokens.strokeWidthThick,
    outlineStyle: 'solid',
    outlineColor: tokens.colorStrokeFocus2,
    outlineOffset: '2px'
  })
})

/**
 * Props for the start of a dialog's or a popover's content, which takes the focus as it opens.
 */
export interface IFocusContentProps<T extends HTMLElement = HTMLElement> {
  ref: RefObject<T>

  /**
   * Focusable from script, outside the tab order.
   */
  tabIndex: -1

  /**
   * A focus ring while the keyboard has put the focus there.
   */
  className: string
}

/**
 * Props for a popover whose content starts with text: with a tab index the surface takes the focus
 * as it opens (Fluent's `Popover` focuses a surface that has one, and otherwise its first control),
 * so a screen reader reads it from the top, and Tab goes on to the first action. As the timeline's
 * details do (`DetailsPopover`).
 *
 * @returns `tabIndex` and the class of the focus ring, for `PopoverSurface`
 */
export function useFocusContentProps(): Omit<IFocusContentProps, 'ref'> {
  return { tabIndex: -1, className: useStyles().content }
}

/**
 * Gives the focus to the start of a dialog's content as it opens: the element the returned `ref`
 * is put on, a `DialogSurface`. Fluent's dialog gives its first control the focus as it opens, so a
 * screen reader read the first action first («Avbryt, button») and the text before it only by
 * reading backwards (VoiceOver, Puzzlepart/prosjektportalen365-testing#132). The focus moves to the
 * surface in the frame after, which a screen reader reads with its title and description, and Tab
 * goes on to the first action. Escape and the focus given back as the dialog closes are Fluent's,
 * as before.
 *
 * @param open Whether the dialog is open
 * @returns The `ref`, `tabIndex` and class for the `DialogSurface`
 */
export function useFocusContentOnOpen<T extends HTMLElement = HTMLDivElement>(
  open: boolean
): IFocusContentProps<T> {
  const ref = useRef<T>(null)
  const props = useFocusContentProps()
  useEffect(() => {
    if (!open) return undefined
    // Where Fluent put the focus as the dialog opened (its effect runs before this one): moved on
    // only if it is still there, not if the dialog has given it to something else since, such as
    // a button it shows after an error (`autoFocus`).
    const placed = (ref.current?.ownerDocument ?? document).activeElement
    const frame = requestAnimationFrame(() => {
      const surface = ref.current
      if (surface && surface.ownerDocument.activeElement === placed) surface.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open])
  return { ref, ...props }
}
