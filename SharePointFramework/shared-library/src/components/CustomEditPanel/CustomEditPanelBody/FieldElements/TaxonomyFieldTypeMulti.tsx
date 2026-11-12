import { ModernTaxonomyPicker } from '@pnp/spfx-controls-react/lib/ModernTaxonomyPicker'
import React, { useCallback, useMemo } from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'
import { getTermPickerProps } from './termPickerProps'
import { Term, useInitialTaxonomyValues } from './useInitialTaxonomyValues'

/**
 * Edits multiple taxonomy terms with normalized picker values.
 */
export const TaxonomyFieldTypeMulti: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  const mapInitialValues = useInitialTaxonomyValues()
  const terms = context.model.get<Term[]>(field)
  const termPickerProps = useMemo(() => getTermPickerProps(field.displayName), [field.displayName])
  type NormalizedTerm = NonNullable<ReturnType<typeof mapInitialValues>>

  const normalizeTerms = useCallback(
    (items?: Term[]) =>
      (items ?? []).map(mapInitialValues).filter((term): term is NormalizedTerm => term !== null),
    [mapInitialValues]
  )

  const handleChange = useCallback(
    (items?: Term[]) => {
      const normalized = normalizeTerms(items)
      void context.model.set(field, normalized)
    },
    [context.model, field, normalizeTerms]
  )

  return (
    <FieldContainer
      iconName='AppsList'
      label={field.displayName}
      description={field.description}
      required={field.required}
    >
      <ModernTaxonomyPicker
        context={context.props.dataAdapter.spfxContext as any} // PnP's context type does not accept every host in our SPFxContext union.
        panelTitle={field.description || field.displayName}
        initialValues={normalizeTerms(terms)}
        allowMultipleSelections
        label=''
        termSetId={field.getProperty('TermSetId')}
        termPickerProps={termPickerProps}
        onChange={handleChange}
      />
    </FieldContainer>
  )
}
