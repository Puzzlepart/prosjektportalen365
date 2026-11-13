import { RefCallback, useCallback, useEffect, useRef } from 'react'

/**
 * Names PnP's «Tag» button and has the field's hint describe the term input, in the DOM of a
 * `ModernTaxonomyPicker` inside `container`. A way round PnP, which takes neither from its props:
 *
 * - the button that opens the term panel is an icon button with no name, only a tooltip
 *   («Legg til merke») it points at while the tooltip shows (axe: button-name, critical);
 * - Fluent v8's BasePicker sets the input's `aria-describedby` after `inputProps`, to the list of
 *   the terms picked or to nothing, so the field's hint never reached it. The hint (and the field's
 *   message) comes first, and the list, when there is one, stays after it.
 *
 * Sets an attribute only when it differs, so a `MutationObserver` calling this sees no change of
 * its own.
 *
 * @param container The element the picker is rendered in
 * @param buttonLabel The name for the button, «Velg termer for {field}»
 * @param describedBy The ids of the field's hint and message, as Fluent's field gives them
 */
export function applyTaxonomyPickerAria(
  container: HTMLElement,
  buttonLabel: string,
  describedBy?: string
): void {
  const button = container.querySelector('[data-icon-name="Tag"]')?.closest('button')
  if (button && button.getAttribute('aria-label') !== buttonLabel) {
    button.setAttribute('aria-label', buttonLabel)
  }
  const input = container.querySelector('input[role="combobox"]')
  if (!input || !describedBy) return
  const own = describedBy.split(/\s+/).filter(Boolean)
  const others = (input.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter((id) => id && !own.includes(id))
  const value = [...own, ...others].join(' ')
  if (input.getAttribute('aria-describedby') !== value) {
    input.setAttribute('aria-describedby', value)
  }
}

/**
 * Keeps `applyTaxonomyPickerAria` applied to the picker in the element the returned ref is put on:
 * once it is rendered, and again whenever PnP renders the button or the input anew or sets the
 * input's `aria-describedby` back, as it does when a term is picked or removed.
 *
 * @param buttonLabel The name for PnP's «Tag» button
 * @param describedBy The ids of the field's hint and message
 */
export function useTaxonomyPickerAria(
  buttonLabel: string,
  describedBy?: string
): RefCallback<HTMLElement> {
  const containerRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)
  const latest = useRef({ buttonLabel, describedBy })
  latest.current = { buttonLabel, describedBy }

  const apply = useCallback(() => {
    if (!containerRef.current) return
    applyTaxonomyPickerAria(
      containerRef.current,
      latest.current.buttonLabel,
      latest.current.describedBy
    )
  }, [])

  const ref = useCallback<RefCallback<HTMLElement>>(
    (element) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      containerRef.current = element
      if (!element) return
      apply()
      if (typeof MutationObserver === 'undefined') return
      observerRef.current = new MutationObserver(apply)
      observerRef.current.observe(element, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['aria-describedby', 'aria-label']
      })
    },
    [apply]
  )

  useEffect(() => apply(), [apply, buttonLabel, describedBy])
  useEffect(() => () => observerRef.current?.disconnect(), [])

  return ref
}
