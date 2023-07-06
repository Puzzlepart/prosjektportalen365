import { tryParseCurrency } from 'pp365-shared-library'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { ICurrencyColumnProps } from './types'
import strings from 'PortfolioWebPartsStrings'
import { TextField, ITextFieldProps } from '@fluentui/react'

export const CurrencyColumn: ColumnRenderComponent<ICurrencyColumnProps> = (props) => {
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

CurrencyColumn.defaultProps = {
  currencyPrefix: 'kr',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}
CurrencyColumn.key = 'currency'
CurrencyColumn.id = 'Currency'
CurrencyColumn.displayName = strings.ColumnRenderOptionCurrency
CurrencyColumn.iconName = 'Money'
CurrencyColumn.getDataTypeOption = () => ({
  key: CurrencyColumn.key,
  id: CurrencyColumn.id,
  text: CurrencyColumn.displayName,
  data: {
    iconProps: { iconName: CurrencyColumn.iconName },
    getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
      [
        TextField,
        {
          type: 'number',
          label: strings.ColumnRenderOptionCurrencyMinimumFractionDigitsLabel,
          placeholder: CurrencyColumn.defaultProps.minimumFractionDigits.toString(),
          value: dataTypeProperties.minimumFractionDigits,
          onChange: (_, value) => onChange('minimumFractionDigits', parseInt(value))
        } as ITextFieldProps
      ],
      [
        TextField,
        {
          type: 'number',
          label: strings.ColumnRenderOptionCurrencyMaximumFractionDigitsLabel,
          placeholder: CurrencyColumn.defaultProps.maximumFractionDigits.toString(),
          value: dataTypeProperties.maximumFractionDigits,
          onChange: (_, value) => onChange('maximumFractionDigits', parseInt(value))
        } as ITextFieldProps
      ],
      [
        TextField,
        {
          label: strings.ColumnRenderOptionCurrencyFallbackValueLabel,
          value: dataTypeProperties.fallbackValue,
          onChange: (_, value) => onChange('fallbackValue', value)
        } as ITextFieldProps
      ],
      [
        TextField,
        {
          label: strings.ColumnRenderOptionCurrencyPrefixLabel,
          placeholder: CurrencyColumn.defaultProps.currencyPrefix,
          value: dataTypeProperties.currencyPrefix,
          onChange: (_, value) => onChange('currencyPrefix', value)
        } as ITextFieldProps
      ]
    ]
  }
})
