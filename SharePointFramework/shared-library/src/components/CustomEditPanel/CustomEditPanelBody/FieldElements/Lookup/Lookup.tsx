import { Combobox, Option } from '@fluentui/react-components'
import React from 'react'
import { FieldContainer } from '../../../../FieldContainer'
import { useCustomEditPanelContext } from '../../../context'
import { FieldElementComponent } from '../types'
import { useLookup } from './useLookup'

export const Lookup: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  const { options, value } = useLookup(field)
  return (
    <FieldContainer iconName='Link' label={field.displayName} description={field.description} required={field.required}>
      <Combobox
        value={value?.text}
        selectedOptions={[value?.value]}
        onOptionSelect={(_, data) => context.model.set(field, data.optionValue)}
      >
        {options.map((option) => (
          <Option key={option.key} value={option.value}>
            {option.text}
          </Option>
        ))}
      </Combobox>
    </FieldContainer>
  )
}
