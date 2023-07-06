import { ITextFieldProps, TextField } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IBooleanColumnProps } from './types'
import { IColumnDataTypePropertyField } from '../../../ColumnDataTypeField/types'
import { registerColumnRenderComponent } from '../columnRenderComponentRegistry'

/**
 * Renders a boolean column that displays a custom string value for true and false values.
 *
 * @param props - The props for the component.
 * @param props.columnValue - The value of the column.
 * @param props.valueIfTrue - The string value to display if the column value is true.
 * @param props.valueIfFalse - The string value to display if the column value is false.
 *
 * @returns The rendered component.
 */
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
registerColumnRenderComponent(
  BooleanColumn,
  (onChange, dataTypeProperties: Record<string, any>) => {
    const properties: IColumnDataTypePropertyField<any>[] = [
      {
        type: TextField,
        props: {
          label: strings.ColumnRenderOptionBooleanTrue,
          placeholder: BooleanColumn.defaultProps.valueIfTrue,
          value: dataTypeProperties['valueIfTrue'],
          onChange: (_, value) => onChange('valueIfTrue', value)
        }
      } as IColumnDataTypePropertyField<ITextFieldProps>,
      {
        type: TextField,
        props: {
          label: strings.ColumnRenderOptionBooleanFalse,
          placeholder: BooleanColumn.defaultProps.valueIfFalse,
          defaultValue: dataTypeProperties['valueIfFalse'],
          onChange: (_, value) => onChange('valueIfFalse', value)
        }
      } as IColumnDataTypePropertyField<ITextFieldProps>
    ]
    return properties
  }
)
