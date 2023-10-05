import _ from 'lodash'
import React, { FC } from 'react'
import { IColumnSearchPropertyFieldProps } from './types'
import { FormFieldContainer } from '../FormFieldContainer'
import { Autocomplete } from '../Autocomplete'
import { Input } from '@fluentui/react-components'

export const ColumnSearchPropertyField: FC<IColumnSearchPropertyFieldProps> = (props) => {
  return (
    <FormFieldContainer description={props.description}>
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
