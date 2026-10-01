import strings from 'SharedLibraryStrings'
import React from 'react'
import { isTrueBooleanValue } from '../../../util/isTrueBooleanValue'
import { IColumnDataTypePropertyField, textField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import { IBooleanColumnProps } from './types'
import { Text } from '@fluentui/react-components'

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
  const displayValue = isTrueBooleanValue(props.columnValue)
    ? props.valueIfTrue
    : props.valueIfFalse
  return <Text size={200}>{displayValue}</Text>
}

BooleanColumn.defaultProps = {
  valueIfTrue: strings.BooleanYes,
  valueIfFalse: strings.BooleanNo
}
BooleanColumn.key = 'boolean'
BooleanColumn.id = 'Boolean'
BooleanColumn.displayName = strings.ColumnRenderOptionBoolean
BooleanColumn.iconName = 'CheckboxComposite'
BooleanColumn.getDataTypeProperties = (onChange, dataTypeProperties: Record<string, any>) => {
  const properties: IColumnDataTypePropertyField[] = [
    textField({
      label: strings.ColumnRenderOptionBooleanTrue,
      placeholder: BooleanColumn.defaultProps.valueIfTrue,
      value: dataTypeProperties.valueIfTrue,
      onChange: (value) => onChange('valueIfTrue', value)
    }),
    textField({
      label: strings.ColumnRenderOptionBooleanFalse,
      placeholder: BooleanColumn.defaultProps.valueIfFalse,
      value: dataTypeProperties.valueIfFalse,
      onChange: (value) => onChange('valueIfFalse', value)
    })
  ]
  return properties
}
