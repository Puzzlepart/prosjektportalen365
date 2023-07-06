import {
  Checkbox,
  ICheckboxProps,
  IRenderFunction,
  ITextFieldProps,
  IToggleProps,
  Icon,
  TextField,
  Toggle
} from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { ColumnRenderFieldOption, IColumnRenderFieldProps } from './types'
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import {
  BooleanColumn,
  CurrencyColumn,
  TagsColumn,
  UrlColumn,
  ModalColumn,
  TrendColumn
} from '../List'

/**
 * Hook to work with render as options. Returns the options, the selected option,
 * and a function to render the option.
 *
 * @param props ColumnRenderField props
 */
export function useRenderAsOptions(props: IColumnRenderFieldProps) {
  const renderAsOptions: ColumnRenderFieldOption[] = [
    {
      key: 'text',
      id: 'Text',
      text: strings.ColumnRenderOptionText,
      data: { iconProps: { iconName: 'FontColor' } }
    },
    {
      key: 'boolean',
      id: 'Boolean',
      text: strings.ColumnRenderOptionBoolean,
      data: {
        iconProps: { iconName: 'CheckboxComposite' },
        getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
          [
            TextField,
            {
              label: strings.ColumnRenderOptionBooleanTrue,
              placeholder: strings.ColumnRenderOptionBooleanTrue,
              value: dataTypeProperties['valueIfTrue'] ?? BooleanColumn.defaultProps.valueIfTrue,
              onChange: (_, value) => onChange('valueIfTrue', value)
            } as ITextFieldProps
          ],
          [
            TextField,
            {
              label: strings.ColumnRenderOptionBooleanFalse,
              placeholder: strings.ColumnRenderOptionBooleanFalse,
              defaultValue:
                dataTypeProperties['valueIfFalse'] ?? BooleanColumn.defaultProps.valueIfFalse,
              onChange: (_, value) => onChange('valueIfFalse', value)
            } as ITextFieldProps
          ]
        ]
      }
    },
    {
      key: 'note',
      id: 'Note',
      text: strings.ColumnRenderOptionNote,
      data: { iconProps: { iconName: 'EditStyle' } }
    },
    {
      key: 'number',
      id: 'Number',
      text: strings.ColumnRenderOptionNumber,
      data: { iconProps: { iconName: 'NumberedList' } }
    },
    {
      key: 'currency',
      id: 'Currency',
      text: strings.ColumnRenderOptionCurrency,
      data: {
        iconProps: { iconName: 'Money' },
        getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
          [
            TextField,
            {
              type: 'number',
              label: strings.ColumnRenderOptionCurrencyMinimumFractionDigitsLabel,
              value:
                dataTypeProperties.minimumFractionDigits ??
                CurrencyColumn.defaultProps.minimumFractionDigits,
              onChange: (_, value) => onChange('minimumFractionDigits', parseInt(value))
            } as ITextFieldProps
          ],
          [
            TextField,
            {
              type: 'number',
              label: strings.ColumnRenderOptionCurrencyMaximumFractionDigitsLabel,
              value:
                dataTypeProperties.maximumFractionDigits ??
                CurrencyColumn.defaultProps.maximumFractionDigits,
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
              value:
                dataTypeProperties.currencyPrefix ?? CurrencyColumn.defaultProps.currencyPrefix,
              onChange: (_, value) => onChange('currencyPrefix', value)
            } as ITextFieldProps
          ]
        ]
      }
    },
    {
      key: 'date',
      id: 'Date',
      text: strings.ColumnRenderOptionDate,
      data: {
        iconProps: { iconName: 'Calendar' },
        getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
          [
            Toggle,
            {
              label: strings.ColumnRenderOptionDateIncludeTimeLabel,
              checked: dataTypeProperties.includeTime ?? false,
              onChange: (_, checked) => onChange('includeTime', checked)
            } as IToggleProps
          ]
        ]
      }
    },
    {
      key: 'datetime',
      id: 'DateTime',
      text: strings.ColumnRenderOptionDateTime,
      data: {
        iconProps: { iconName: 'DateTime' }
      }
    },
    {
      key: 'user',
      id: 'User',
      text: strings.ColumnRenderOptionUser,
      data: { iconProps: { iconName: 'Contact' } }
    },
    {
      key: 'list',
      id: 'List',
      text: strings.ColumnRenderOptionList,
      data: { iconProps: { iconName: 'List' } }
    },
    {
      key: 'tags',
      id: 'Tags',
      text: strings.ColumnRenderOptionTags,
      data: {
        iconProps: { iconName: 'Tag' },
        getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
          [
            TextField,
            {
              label: strings.ColumnRenderOptionTagsValueSeparatorLabel,
              description: strings.ColumnRenderOptionTagsValueSeparatorDescription,
              value: dataTypeProperties.valueSeparator ?? TagsColumn.defaultProps.valueSeparator,
              onChange: (_, value) => onChange('valueSeparator', value)
            } as ITextFieldProps
          ]
        ]
      }
    },
    {
      key: 'percentage',
      id: 'Percentage',
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
              checked: dataTypeProperties.openInNewTab ?? UrlColumn.defaultProps.openInNewTab,
              onChange: (_, checked) => onChange('openInNewTab', checked)
            } as IToggleProps
          ],
          [
            TextField,
            {
              label: strings.ColumnRenderOptionUrlDescriptionLabel,
              description: strings.ColumnRenderOptionUrlDescriptionDescription,
              value: dataTypeProperties.description,
              onChange: (_, value) => onChange('description', value)
            } as ITextFieldProps
          ]
        ]
      }
    },
    {
      key: 'trend',
      id: 'Trend',
      text: strings.ColumnRenderOptionTrend,
      data: {
        iconProps: { iconName: 'Trending12' },
        getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
          [
            Checkbox,
            {
              label: strings.ColumnRenderOptionTrendShowTrendIconLabel,
              defaultChecked: TrendColumn.defaultProps.showTrendIcon,
              checked: dataTypeProperties.showTrendIcon,
              onChange: (_, checked) => onChange('showTrendIcon', checked)
            } as ICheckboxProps
          ]
        ]
      },
      disabled: true
    },
    {
      key: 'modal',
      id: 'Modal',
      text: strings.ColumnRenderOptionModal,
      data: {
        iconProps: { iconName: 'WindowEdit' },
        getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
          [
            TextField,
            {
              label: strings.ColumnRenderOptionModalLinkTextLabel,
              placeholder: ModalColumn.defaultProps.linkText,
              value: dataTypeProperties['linkText'],
              onChange: (_, value) => onChange('linkText', value)
            } as ITextFieldProps
          ],
          [
            Checkbox,
            {
              label: strings.ColumnRenderOptionModalShowInfoTextLabel,
              defaultChecked: ModalColumn.defaultProps.showInfoText,
              checked: dataTypeProperties.showInfoText,
              onChange: (_, value) => onChange('showInfoText', value)
            } as ICheckboxProps
          ],
          [
            TextField,
            {
              label: strings.ColumnRenderOptionModalInfoTextTemplateLabel,
              description: strings.ColumnRenderOptionModalInfoTextTemplateDescription,
              placeholder: ModalColumn.defaultProps.infoTextTemplate,
              value: dataTypeProperties.infoTextTemplate,
              multiline: true,
              disabled: !dataTypeProperties.showInfoText,
              onChange: (_, value) => onChange('infoTextTemplate', value)
            } as ITextFieldProps
          ]
        ]
      },
      disabled: true
    },
    {
      key: 'filename',
      id: 'Filename',
      text: strings.ColumnRenderOptionFilename,
      data: { iconProps: { iconName: 'FileImage' } }
    },
    {
      key: 'list',
      id: 'List',
      text: strings.ColumnRenderOptionList,
      data: { iconProps: { iconName: 'List' } }
    }
  ]

  const [selectedOption, setSelectedOption] = useState<ColumnRenderFieldOption>(
    _.find(renderAsOptions, (option) => option.key === props.defaultSelectedKey)
  )

  const onChange = (option?: ColumnRenderFieldOption) => {
    if (!option) return
    props.onChange(option.id)
  }

  /**
   * Render function for dropdown options.
   *
   * @param option Option to render
   */
  const onRenderOption: IRenderFunction<ColumnRenderFieldOption> = (option) => (
    <div>
      {option.data?.iconProps && (
        <Icon {...option.data.iconProps} styles={{ root: { marginRight: 6 } }} />
      )}
      <span>{option.text}</span>
    </div>
  )

  useEffect(() => {
    onChange(selectedOption)
  }, [selectedOption])

  return { renderAsOptions, onChange, selectedOption, setSelectedOption, onRenderOption } as const
}
