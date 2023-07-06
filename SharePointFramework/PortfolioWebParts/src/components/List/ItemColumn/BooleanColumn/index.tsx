import { ITextFieldProps, TextField } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IBooleanColumnProps } from './types'

export const BooleanColumn: ColumnRenderComponent<IBooleanColumnProps> = (props) => {
  const displayValue = parseInt(props.columnValue) === 1 ? props.valueIfTrue : props.valueIfFalse
  return <span>{displayValue}</span>
}

BooleanColumn.defaultProps = {
  valueIfTrue: strings.BooleanYes,
  valueIfFalse: strings.BooleanNo
}
BooleanColumn.key = 'boolean'
BooleanColumn.id = 'Boolean'
BooleanColumn.displayName = strings.ColumnRenderOptionBoolean
BooleanColumn.iconName = 'CheckboxComposite'
BooleanColumn.getDataTypeOption = () => ({
  key: BooleanColumn.key,
  id: BooleanColumn.id,
  text: strings.ColumnRenderOptionBoolean,
  data: {
    iconProps: { iconName: BooleanColumn.iconName },
    getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
      [
        TextField,
        {
          label: strings.ColumnRenderOptionBooleanTrue,
          placeholder: BooleanColumn.defaultProps.valueIfTrue,
          value: dataTypeProperties['valueIfTrue'],
          onChange: (_, value) => onChange('valueIfTrue', value)
        } as ITextFieldProps
      ],
      [
        TextField,
        {
          label: strings.ColumnRenderOptionBooleanFalse,
          placeholder: BooleanColumn.defaultProps.valueIfFalse,
          defaultValue: dataTypeProperties['valueIfFalse'],
          onChange: (_, value) => onChange('valueIfFalse', value)
        } as ITextFieldProps
      ]
    ]
  }
})
