import { ModernTaxonomyPicker } from "@pnp/spfx-controls-react/lib/ModernTaxonomyPicker";
import React from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

export const TaxonomyFieldTypeMulti: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()

  return (
    <FieldContainer
      iconName='AppsList'
      label={field.displayName}
      description={field.description}
      required={field.required}
    >
      <ModernTaxonomyPicker
        context={context.props.spfxContext as any} // Newest version of the control requires this cast for now, as context type is incompatibale with other types of SPFxContext
        panelTitle={field.displayName}
        allowMultipleSelections
        label=''
        termSetId={field.getProperty('TermSetId')}
        onChange={(items) => context.model.set(field, items)}
      />
    </FieldContainer>
  )
}
