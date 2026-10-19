import React from 'react'
import { DateField } from '../../../DateField'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

/**
 * A date field of the item: the shared `DateField`, which speaks SharePoint's UI language and
 * ties the label to the picker, with the field's day in the model.
 */
export const DateTime: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  return (
    <DateField
      label={field.displayName}
      description={field.description}
      required={field.required}
      value={context.model.get(field)}
      onSelectDate={(date) => context.model.set(field, date)}
    />
  )
}
