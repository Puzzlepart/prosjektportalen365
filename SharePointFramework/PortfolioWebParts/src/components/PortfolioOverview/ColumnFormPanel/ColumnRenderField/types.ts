import {
  IDropdownProps,
  IIconProps,
  ISelectableOption,
  ITextFieldProps,
  IToggleProps,
  TextField,
  Toggle
} from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'

export type ColumnRenderFieldOptionAdditionalField = [React.ComponentType, any]

export type ColumnRenderFieldOption = ISelectableOption<{
  iconProps: IIconProps
  getDataTypeProperties?: (
    onChange: (key: string, value: any) => void,
    dataTypeProperties: Record<string, any>
  ) => ColumnRenderFieldOptionAdditionalField[]
}>

export interface IColumnRenderFieldProps extends Pick<IDropdownProps, 'defaultSelectedKey'> {
  onChange: (value: string) => void
  dataTypeProperties?: Record<string, any>
  onDataTypePropertiesChange: (properties: Record<string, any>) => void
}

export const renderAsOptions: ColumnRenderFieldOption[] = [
  {
    key: 'text',
    text: strings.ColumnRenderOptionText,
    data: { iconProps: { iconName: 'FontColor' } }
  },
  {
    key: 'boolean',
    text: strings.ColumnRenderOptionBoolean,
    data: {
      iconProps: { iconName: 'CheckboxComposite' },
      getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
        [
          TextField,
          {
            label: strings.ColumnRenderOptionBooleanTrue,
            placeholder: strings.ColumnRenderOptionBooleanTrue,
            value: dataTypeProperties['valueIfTrue'] ?? strings.BooleanYes,
            onChange: (_, value) => onChange('valueIfTrue', value)
          } as ITextFieldProps
        ],
        [
          TextField,
          {
            label: strings.ColumnRenderOptionBooleanFalse,
            placeholder: strings.ColumnRenderOptionBooleanFalse,
            defaultValue: dataTypeProperties['valueIfFalse'] ?? strings.BooleanNo,
            onChange: (_, value) => onChange('valueIfFalse', value)
          } as ITextFieldProps
        ]
      ]
    }
  },
  {
    key: 'note',
    text: strings.ColumnRenderOptionNote,
    data: { iconProps: { iconName: 'EditStyle' } }
  },
  {
    key: 'number',
    text: strings.ColumnRenderOptionNumber,
    data: { iconProps: { iconName: 'NumberedList' } }
  },
  {
    key: 'currency',
    text: strings.ColumnRenderOptionCurrency,
    data: {
      iconProps: { iconName: 'Money' },
      getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
        [
          TextField,
          {
            type: 'number',
            label: strings.ColumnRenderOptionCurrencyMinimumFractionDigitsLabel,
            value: dataTypeProperties['minimumFractionDigits'] ?? '0',
            onChange: (_, value) => onChange('minimumFractionDigits', parseInt(value))
          } as ITextFieldProps
        ],
        [
          TextField,
          {
            type: 'number',
            label: strings.ColumnRenderOptionCurrencyMaximumFractionDigitsLabel,
            value: dataTypeProperties['maximumFractionDigits'] ?? '0',
            onChange: (_, value) => onChange('maximumFractionDigits', parseInt(value))
          } as ITextFieldProps
        ],
        [
          TextField,
          {
            label: strings.ColumnRenderOptionCurrencyFallbackValueLabel,
            value: dataTypeProperties['fallbackValue'] ?? '',
            onChange: (_, value) => onChange('fallbackValue', value)
          } as ITextFieldProps
        ],
        [
          TextField,
          {
            label: strings.ColumnRenderOptionCurrencyPrefixLabel,
            value: dataTypeProperties['currencyPrefix'] ?? 'kr',
            onChange: (_, value) => onChange('currencyPrefix', value)
          } as ITextFieldProps
        ]
      ]
    }
  },
  {
    key: 'date',
    text: strings.ColumnRenderOptionDate,
    data: {
      iconProps: { iconName: 'Calendar' },
      getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
        [
          Toggle,
          {
            label: strings.ColumnRenderOptionDateIncludeTimeLabel,
            checked: dataTypeProperties['includeTime'] ?? false,
            onChange: (_, checked) => onChange('includeTime', checked)
          } as IToggleProps
        ]
      ]
    }
  },
  {
    key: 'user',
    text: strings.ColumnRenderOptionUser,
    data: { iconProps: { iconName: 'Contact' } }
  },
  {
    key: 'list',
    text: strings.ColumnRenderOptionList,
    data: { iconProps: { iconName: 'List' } }
  },
  {
    key: 'tags',
    text: strings.ColumnRenderOptionTags,
    data: { iconProps: { iconName: 'Tag' } }
  },
  {
    key: 'percentage',
    text: strings.ColumnRenderOptionPercentage,
    data: { iconProps: { iconName: 'CalculatorPercentage' } }
  },
  {
    key: 'url',
    id: 'URL',
    text: strings.ColumnRenderOptionUrl,
    data: {
      iconProps: { iconName: 'Link' },
      getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
        [
          Toggle,
          {
            label: strings.ColumnRenderOptionUrlOpenInNewTabLabel,
            checked: dataTypeProperties['openInNewTab'] ?? false,
            onChange: (_, checked) => onChange('openInNewTab', checked)
          } as IToggleProps
        ],
        [
          TextField,
          {
            label: strings.ColumnRenderOptionUrlDescriptionLabel,
            description: strings.ColumnRenderOptionUrlDescriptionDescription,
            value: dataTypeProperties['description'],
            onChange: (_, value) => onChange('description', value)
          } as ITextFieldProps
        ]
      ]
    }
  }
]
