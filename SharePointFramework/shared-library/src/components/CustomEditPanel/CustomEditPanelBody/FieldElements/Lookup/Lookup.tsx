import { Dropdown, Option } from '@fluentui/react-components'
import React from 'react'
import { FieldContainer } from '../../../../FieldContainer'
import { FieldElementComponent } from '../types'
import { useLookup } from './useLookup'

export const Lookup: FieldElementComponent = ({ field }) => {
  const { options, defaultValue } = useLookup(field)
  return (
    <FieldContainer iconName='Link' label={field.displayName} description={field.description}>
      <Dropdown defaultSelectedOptions={[defaultValue]} defaultValue={defaultValue}>
        {options.map((option) => (
          <Option key={option.key} value={option.value}>
            {option.text}
          </Option>
        ))}
      </Dropdown>
    </FieldContainer>
  )
}
