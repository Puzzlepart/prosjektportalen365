import { TextField } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { tryParseCurrency } from 'pp365-shared-library'
import React from 'react'
import { ColumnDataTypePropertyField } from '../ColumnDataTypeField'
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
  ColumnDataTypePropertyField(
    TextField,
    {
      type: 'number',
      label: strings.ColumnRenderOptionCurrencyMinimumFractionDigitsLabel,
      placeholder: CurrencyColumn.defaultProps.minimumFractionDigits.toString(),
      value: dataTypeProperties.minimumFractionDigits,
      onChange: (_, value) => onChange('minimumFractionDigits', parseInt(value))
    }
  ),
  ColumnDataTypePropertyField(
    TextField,
    {
      type: 'number',
      label: strings.ColumnRenderOptionCurrencyMaximumFractionDigitsLabel,
      placeholder: CurrencyColumn.defaultProps.maximumFractionDigits.toString(),
      value: dataTypeProperties.maximumFractionDigits,
      onChange: (_, value) => onChange('maximumFractionDigits', parseInt(value))
    }
  ),
  ColumnDataTypePropertyField(
    TextField,
    {
      label: strings.ColumnRenderOptionCurrencyFallbackValueLabel,
      value: dataTypeProperties.fallbackValue,
      onChange: (_, value) => onChange('fallbackValue', value)
    }
  ),
  ColumnDataTypePropertyField(
    TextField,
    {
      label: strings.ColumnRenderOptionCurrencyPrefixLabel,
      placeholder: CurrencyColumn.defaultProps.currencyPrefix,
      value: dataTypeProperties.currencyPrefix,
      onChange: (_, value) => onChange('currencyPrefix', value)
    }
  )
]
