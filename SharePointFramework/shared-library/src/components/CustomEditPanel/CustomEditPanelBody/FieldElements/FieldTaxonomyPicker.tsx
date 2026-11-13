import { FieldControlProps, useFieldControlProps_unstable } from '@fluentui/react-components'
import {
  IModernTaxonomyPickerProps,
  ModernTaxonomyPicker
} from '@pnp/spfx-controls-react/lib/ModernTaxonomyPicker'
import React, { FC, useMemo } from 'react'
import strings from 'SharedLibraryStrings'
import { format } from '../../../../util/format'
import { getTermPickerProps } from './termPickerProps'
import { useTaxonomyPickerAria } from './useTaxonomyPickerAria'

/**
 * Props for `FieldTaxonomyPicker`: PnP's picker without its own label, which the field gives, and
 * without its term input's props, which come from `getTermPickerProps`.
 */
export interface IFieldTaxonomyPickerProps extends Omit<
  IModernTaxonomyPickerProps,
  'label' | 'termPickerProps'
> {
  /**
   * The field's display name, which names the term input.
   */
  fieldLabel: string
}

/**
 * PnP's `ModernTaxonomyPicker` inside a `FieldContainer`, its term input given the id of the field
 * it is in. PnP's picker does not read Fluent's field, so its input took an id of its own and the
 * field's label pointed at nothing: a click on «Prosjekttype» did not reach the input. Its «Tag»
 * button had no name, and the field's hint did not describe the input; both are set in the DOM
 * after PnP renders (`useTaxonomyPickerAria`), since PnP takes neither from its props.
 */
export const FieldTaxonomyPicker: FC<IFieldTaxonomyPickerProps> = ({ fieldLabel, ...props }) => {
  const { id, 'aria-describedby': describedBy } = useFieldControlProps_unstable<FieldControlProps>(
    {},
    { supportsLabelFor: true }
  )
  const termPickerProps = useMemo(() => getTermPickerProps(fieldLabel, id), [fieldLabel, id])
  const containerRef = useTaxonomyPickerAria(
    format(strings.Aria.TaxonomyPickerButtonLabel, fieldLabel),
    describedBy
  )
  return (
    <div ref={containerRef}>
      <ModernTaxonomyPicker {...props} label='' termPickerProps={termPickerProps} />
    </div>
  )
}
