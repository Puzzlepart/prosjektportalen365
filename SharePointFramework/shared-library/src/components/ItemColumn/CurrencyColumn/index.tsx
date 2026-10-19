import strings from 'SharedLibraryStrings'
import { tryParseCurrency, withDefaults } from '../../../util'
import React from 'react'
import { numberField, textField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import { ICurrencyColumnProps } from './types'

const CURRENCY_COLUMN_DEFAULT_PROPS: Partial<ICurrencyColumnProps> = {
  currencyPrefix: 'kr',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}

export const CurrencyColumn: ColumnRenderComponent<ICurrencyColumnProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, CURRENCY_COLUMN_DEFAULT_PROPS)
  return (
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
}

CurrencyColumn.key = 'currency'
CurrencyColumn.id = 'Currency'
CurrencyColumn.displayName = strings.ColumnRenderOptionCurrency
CurrencyColumn.iconName = 'Money'
CurrencyColumn.getDataTypeProperties = (onChange, dataTypeProperties: Record<string, any>) => [
  numberField({
    label: strings.ColumnRenderOptionCurrencyMinimumFractionDigitsLabel,
    placeholder: CURRENCY_COLUMN_DEFAULT_PROPS.minimumFractionDigits.toString(),
    value: dataTypeProperties.minimumFractionDigits,
    onChange: (value) => onChange('minimumFractionDigits', value)
  }),
  numberField({
    label: strings.ColumnRenderOptionCurrencyMaximumFractionDigitsLabel,
    placeholder: CURRENCY_COLUMN_DEFAULT_PROPS.maximumFractionDigits.toString(),
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
    placeholder: CURRENCY_COLUMN_DEFAULT_PROPS.currencyPrefix,
    value: dataTypeProperties.currencyPrefix,
    onChange: (value) => onChange('currencyPrefix', value)
  })
]
