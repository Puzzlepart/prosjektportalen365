import { TextField } from '@fluentui/react'
import _ from 'lodash'
import React, { FC } from 'react'
import { IColumnSearchPropertyFieldProps } from './types'
import { FormFieldContainer } from '../FormFieldContainer'
import { Autocomplete } from '../Autocomplete'

export const ColumnSearchPropertyField: FC<IColumnSearchPropertyFieldProps> = (props) => {
  return (
    <FormFieldContainer description={props.description}>
      {_.isEmpty(props.managedProperties) ? (
        <TextField
          label={props.label}
          required={true}
          value={props.value}
          disabled={props.disabled}
          onChange={(_, value) => props.onChange(value)}
        />
      ) : (
        <Autocomplete
          label={props.label}
          placeholder={props.placeholder}
          defaultSelectedKey={props.value}
          disabled={props.disabled}
          iconProps={{
            iconName: 'SearchData'
          }}
          items={props.managedProperties}
          onSelected={(item) => props.onChange(item.key.toString())}
        />
      )}
      {props.children}
    </FormFieldContainer>
  )
}

ColumnSearchPropertyField.defaultProps = {
  managedProperties: []
}
