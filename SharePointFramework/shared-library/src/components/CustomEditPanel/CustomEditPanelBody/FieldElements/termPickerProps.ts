import type { IModernTaxonomyPickerProps } from '@pnp/spfx-controls-react/lib/ModernTaxonomyPicker'

/**
 * Props for the term input of the taxonomy fields' `ModernTaxonomyPicker`. The input is Fluent
 * v8's `BasePicker`, which adds the first suggestion when its suggestions are dismissed, so typing
 * «a» and leaving the field saved «Administrasjon». With `onDismiss` answering `false`, a term is
 * added only when it is chosen: clicked, or picked with Enter or Tab.
 */
export const TERM_PICKER_PROPS: IModernTaxonomyPickerProps['termPickerProps'] = {
  onDismiss: () => false
}
