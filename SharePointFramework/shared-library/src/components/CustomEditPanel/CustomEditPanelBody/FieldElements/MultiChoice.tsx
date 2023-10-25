import { Combobox, Option } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React from 'react'
import _ from 'underscore'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

export const MultiChoice: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  return (
    <FieldContainer
      iconName='MultiselectLtr'
      label={field.displayName}
      description={field.description}
    >
      <Combobox
        value={
          context.model.get<string[]>(field) ? context.model.get<string[]>(field).join(', ') : ''
        }
        defaultSelectedOptions={
          context.model.get<string[]>(field) ? context.model.get<string[]>(field) : []
        }
        multiselect
        placeholder={strings.Placeholder.MultiChoiceField}
        onOptionSelect={(e, data) => {
          if (!_.isEmpty(data.selectedOptions)) {
            context.model.set<string[]>(field, data.selectedOptions)
          } else {
            context.model.set<string[]>(field, [''])
          }
        }}
      >
        {field.choices.map((choice) => (
          <Option key={choice}>{choice}</Option>
        ))}
      </Combobox>
    </FieldContainer>
  )
}
