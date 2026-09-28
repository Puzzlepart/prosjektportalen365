import strings from 'SharedLibraryStrings'
import { tryParseCurrency } from '../../../util'
import React from 'react'
import { numberField, textField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import { ICurrencyColumnProps } from './types'

export const CurrencyColumn: ColumnRenderComponent<ICurrencyColumnProps> = (props) => (
  <span>
    {tryParseCurrency(
      props.columnValue,
      undefined,
      props.currencyPrefix,
      props.minimumFractionDigits,
      props.maximumFractionDigits
    )}
  </span>
)

CurrencyColumn.defaultProps = {
  currencyPrefix: 'kr',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}
CurrencyColumn.key = 'currency'
CurrencyColumn.id = 'Currency'
CurrencyColumn.displayName = strings.ColumnRenderOptionCurrency
CurrencyColumn.iconName = 'Money'
CurrencyColumn.getDataTypeProperties = (onChange, dataTypeProperties: Record<string, any>) => [
  numberField({
    label: strings.ColumnRenderOptionCurrencyMinimumFractionDigitsLabel,
    placeholder: CurrencyColumn.defaultProps.minimumFractionDigits.toString(),
    value: dataTypeProperties.minimumFractionDigits,
    onChange: (value) => onChange('minimumFractionDigits', value)
  }),
  numberField({
    label: strings.ColumnRenderOptionCurrencyMaximumFractionDigitsLabel,
    placeholder: CurrencyColumn.defaultProps.maximumFractionDigits.toString(),
    value: dataTypeProperties.maximumFractionDigits,
    onChange: (value) => onChange('maximumFractionDigits', value)
  }),
  textField({
    label: strings.ColumnRenderOptionCurrencyFallbackValueLabel,
    value: dataTypeProperties.fallbackValue,
    onChange: (value) => onChange('fallbackValue', value)
  }),
  textField({
    label: strings.ColumnRenderOptionCurrencyPrefixLabel,
    placeholder: CurrencyColumn.defaultProps.currencyPrefix,
    value: dataTypeProperties.currencyPrefix,
    onChange: (value) => onChange('currencyPrefix', value)
  })
]
