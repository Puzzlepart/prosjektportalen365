import { ModernTaxonomyPicker } from '@pnp/spfx-controls-react/lib/ModernTaxonomyPicker'
import React, { useCallback } from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'
import { Term, useInitialTaxonomyValues } from './useInitialTaxonomyValues'

export const TaxonomyFieldTypeMulti: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  const mapInitialValues = useInitialTaxonomyValues()
  const terms = context.model.get<Term[]>(field)
  type NormalizedTerm = NonNullable<ReturnType<typeof mapInitialValues>>

  const normalizeTerms = useCallback(
    (items?: Term[]) =>
      (items ?? [])
        .map(mapInitialValues)
        .filter((term): term is NormalizedTerm => term !== null),
    [mapInitialValues]
  )

  const handleChange = useCallback(
    (items?: Term[]) => {
      const normalized = normalizeTerms(items)
      context.model.set(field, normalized)
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
        context={context.props.dataAdapter.spfxContext as any} // Newest version of the control requires this cast for now, as context type is incompatibale with other types of SPFxContext
        panelTitle={field.description || field.displayName}
        initialValues={normalizeTerms(terms)}
        allowMultipleSelections
        label={field.displayName}
        termSetId={field.getProperty('TermSetId')}
        onChange={handleChange}
      />
    </FieldContainer>
  )
}
