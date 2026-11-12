import type { IModernTaxonomyPickerProps } from '@pnp/spfx-controls-react/lib/ModernTaxonomyPicker'
import strings from 'SharedLibraryStrings'

/**
 * Props for the term input of a taxonomy field's `ModernTaxonomyPicker`, whose input is Fluent
 * v8's `BasePicker`. A term is added only when it is chosen: clicked, or picked with Enter.
 *
 * - `onDismiss` answers `false`: the picker added the first suggestion when its suggestions were
 *   dismissed, so typing «a» and leaving the field saved «Administrasjon».
 * - Tab moves the focus on without choosing: the picker took Tab, as Enter, for choosing the
 *   highlighted suggestion. The key's event stops at the input, before the picker's handler.
 * - Given `inputProps`, PnP drops its own name and placeholder, so the input is named after the
 *   field (it was named by the placeholder) and keeps the placeholder.
 * - The input takes the id of the field it is in, which the field's label points at: with an id of
 *   its own (`combobox-id__12`) a click on the label reached nothing.
 * - Text typed and left without a choice stays in the input, completed to the first suggestion,
 *   and is not saved. The picker clears it only with `Autofill.clear()`, which sets the selection:
 *   in Safari the focus follows it, so clearing as the field is left pulls the focus back in
 *   (WebKit bug 224425).
 *
 * @param label The field's display name, which names the input
 * @param id The id of the field's control, which its label is for
 */
export function getTermPickerProps(
  label: string,
  id?: string
): IModernTaxonomyPickerProps['termPickerProps'] {
  return {
    onDismiss: () => false,
    inputProps: {
      id,
      'aria-label': label,
      placeholder: strings.Placeholder.TaxonomyPicker,
      onKeyDown: (event) => {
        if (event.key === 'Tab') event.stopPropagation()
      }
    }
  }
}
