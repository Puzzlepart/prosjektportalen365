import React from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'
import { ModernTaxonomyPicker } from '@pnp/spfx-controls-react'
import { Term, useInitialTaxonomyValues } from './useInitialTaxonomyValues'

export const TaxonomyFieldType: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  const mapInitialValues = useInitialTaxonomyValues()
  const terms = context.model.get<Term[]>(field)

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
        initialValues={terms?.map(mapInitialValues)}
        label=''
        termSetId={field.getProperty('TermSetId')}
        onChange={(items) => context.model.set(field, items)}
      />
    </FieldContainer>
  )
}