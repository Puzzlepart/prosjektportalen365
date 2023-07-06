import { ITextFieldProps, TextField } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { tryParseCurrency } from 'pp365-shared-library'
import React from 'react'
import { IColumnDataTypePropertyField } from '../../../ColumnDataTypeField/types'
import { registerColumnRenderComponent } from '../columnRenderComponentRegistry'
import { ColumnRenderComponent } from '../types'
import { ICurrencyColumnProps } from './types'

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
registerColumnRenderComponent(
  CurrencyColumn,
  (onChange, dataTypeProperties: Record<string, any>) => [
    {
      type: TextField,
      props: {
        type: 'number',
        label: strings.ColumnRenderOptionCurrencyMinimumFractionDigitsLabel,
        placeholder: CurrencyColumn.defaultProps.minimumFractionDigits.toString(),
        value: dataTypeProperties.minimumFractionDigits,
        onChange: (_, value) => onChange('minimumFractionDigits', parseInt(value))
      }
    } as IColumnDataTypePropertyField<ITextFieldProps>,
    {
      type: TextField,
      props: {
        type: 'number',
        label: strings.ColumnRenderOptionCurrencyMaximumFractionDigitsLabel,
        placeholder: CurrencyColumn.defaultProps.maximumFractionDigits.toString(),
        value: dataTypeProperties.maximumFractionDigits,
        onChange: (_, value) => onChange('maximumFractionDigits', parseInt(value))
      }
    } as IColumnDataTypePropertyField<ITextFieldProps>,
    {
      type: TextField,
      props: {
        label: strings.ColumnRenderOptionCurrencyFallbackValueLabel,
        value: dataTypeProperties.fallbackValue,
        onChange: (_, value) => onChange('fallbackValue', value)
      }
    } as IColumnDataTypePropertyField<ITextFieldProps>,
    {
      type: TextField,
      props: {
        label: strings.ColumnRenderOptionCurrencyPrefixLabel,
        placeholder: CurrencyColumn.defaultProps.currencyPrefix,
        value: dataTypeProperties.currencyPrefix,
        onChange: (_, value) => onChange('currencyPrefix', value)
      }
    } as IColumnDataTypePropertyField<ITextFieldProps>
  ]
)
