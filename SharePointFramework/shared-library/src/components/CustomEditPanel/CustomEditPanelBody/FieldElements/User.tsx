import React from 'react'
import { IPersonaItem } from '../../../../types'
import { FieldContainer } from '../../../FieldContainer'
import { PeoplePicker } from '../../../PeoplePicker'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

export const User: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  return (
    <FieldContainer
      iconName='Person'
      label={field.displayName}
      description={field.description}
      required={field.required}
    >
      <PeoplePicker
        aria-label={field.displayName}
        selected={context.model.get<IPersonaItem[]>(field)}
        onResolveSuggestions={(filter, selected) =>
          context.props.dataAdapter.clientPeoplePickerSearchUser(filter, selected)
        }
        onChange={(selected) => context.model.set(field, selected)}
      />
    </FieldContainer>
  )
}
