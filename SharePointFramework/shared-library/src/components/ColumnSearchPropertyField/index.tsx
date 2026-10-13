import _ from 'lodash'
import React, { FC } from 'react'
import { IColumnSearchPropertyFieldProps } from './types'
import { Autocomplete } from '../Autocomplete'
import { Input } from '@fluentui/react-components'
import { withDefaults } from '../../util'

const COLUMN_SEARCH_PROPERTY_FIELD_DEFAULT_PROPS: Partial<IColumnSearchPropertyFieldProps> = {
  managedProperties: []
}

export const ColumnSearchPropertyField: FC<IColumnSearchPropertyFieldProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, COLUMN_SEARCH_PROPERTY_FIELD_DEFAULT_PROPS)
  return (
    <>
      {_.isEmpty(props.managedProperties) ? (
        <Input
          value={props.value}
          disabled={props.disabled}
          onChange={(_, data) => props.onChange(data.value)}
          placeholder={props.placeholder}
        />
      ) : (
        <Autocomplete
          label={props.label}
          placeholder={props.placeholder}
          defaultSelectedKey={props.value}
          disabled={props.disabled}
          items={props.managedProperties}
          // Dismissing the suggestions without a pick hands over no item.
          onSelected={(item) => item && props.onChange(item.key.toString())}
        />
      )}
      {props.children}
    </>
  )
}
