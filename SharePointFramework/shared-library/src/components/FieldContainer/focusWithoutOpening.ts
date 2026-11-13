import { LabelProps } from '@fluentui/react-components'
import { MouseEvent, isValidElement } from 'react'
import { IFieldContainerProps } from './types'

/**
 * A click on a field's label gives the focus to the field's control without opening its popup,
 * when the control opens one on a click: a date's calendar or a choice's list, each a `combobox`.
 * The browser hands a click on a label on to its control as a click, so a click on «Startdato»
 * opened the calendar and took the focus into it, and one on «Prosjektstatus» opened the list.
 * Other controls get the click as before: a checkbox or a switch still toggles.
 */
export function focusWithoutOpening(event: MouseEvent<HTMLLabelElement>): void {
  const { htmlFor, ownerDocument } = event.currentTarget
  if (!htmlFor) return
  const control = ownerDocument.getElementById(htmlFor)
  if (control?.getAttribute('role') !== 'combobox') return
  event.preventDefault()
  control.focus()
}

/**
 * The field's label as Fluent's `Field` takes it, with `focusWithoutOpening` on its clicks. A label
 * given as text or an element becomes the label's children; one given as the label's props keeps
 * its own click handler, which runs first.
 */
export function withFocusWithoutOpening(
  label: IFieldContainerProps['label']
): IFieldContainerProps['label'] {
  if (label === undefined || label === null) return label
  if (typeof label === 'object' && !Array.isArray(label) && !isValidElement(label)) {
    const own = label as LabelProps
    return {
      ...own,
      onClick: (event: MouseEvent<HTMLLabelElement>) => {
        own.onClick?.(event)
        if (!event.defaultPrevented) focusWithoutOpening(event)
      }
    }
  }
  return { children: label as LabelProps['children'], onClick: focusWithoutOpening }
}
