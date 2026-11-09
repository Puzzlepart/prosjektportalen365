import strings from 'SharedLibraryStrings'
import React from 'react'
import { isTrueBooleanValue } from '../../../util/isTrueBooleanValue'
import { IColumnDataTypePropertyField, textField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import { IBooleanColumnProps } from './types'
import { Text } from '@fluentui/react-components'
import { withDefaults } from '../../../util'

const BOOLEAN_COLUMN_DEFAULT_PROPS: Partial<IBooleanColumnProps> = {
  valueIfTrue: strings.BooleanYes,
  valueIfFalse: strings.BooleanNo
}

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
export const BooleanColumn: ColumnRenderComponent<IBooleanColumnProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, BOOLEAN_COLUMN_DEFAULT_PROPS)
  const displayValue = isTrueBooleanValue(props.columnValue)
    ? props.valueIfTrue
    : props.valueIfFalse
  return <Text size={200}>{displayValue}</Text>
}
BooleanColumn.key = 'boolean'
BooleanColumn.id = 'Boolean'
BooleanColumn.displayName = strings.ColumnRenderOptionBoolean
BooleanColumn.iconName = 'CheckboxComposite'
BooleanColumn.getDataTypeProperties = (onChange, dataTypeProperties: Record<string, any>) => {
  const properties: IColumnDataTypePropertyField[] = [
    textField({
      label: strings.ColumnRenderOptionBooleanTrue,
      placeholder: BOOLEAN_COLUMN_DEFAULT_PROPS.valueIfTrue,
      value: dataTypeProperties.valueIfTrue,
      onChange: (value) => onChange('valueIfTrue', value)
    }),
    textField({
      label: strings.ColumnRenderOptionBooleanFalse,
      placeholder: BOOLEAN_COLUMN_DEFAULT_PROPS.valueIfFalse,
      value: dataTypeProperties.valueIfFalse,
      onChange: (value) => onChange('valueIfFalse', value)
    })
  ]
  return properties
}
