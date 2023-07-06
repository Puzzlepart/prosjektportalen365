import {
  Checkbox,
  ICheckboxProps,
  IDropdownProps,
  IRenderFunction,
  ITextFieldProps,
  IToggleProps,
  Icon,
  TextField,
  Toggle
} from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import {
  BooleanColumn,
  CurrencyColumn,
  ModalColumn,
  TagsColumn,
  TrendColumn,
  UrlColumn
} from '../List'
import { IColumnDataTypeFieldOption, IColumnDataTypeFieldProps } from './types'

const dataTypeOptions: IColumnDataTypeFieldOption[] = [
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
            placeholder: BooleanColumn.defaultProps.valueIfTrue,
            value: dataTypeProperties['valueIfTrue'],
            onChange: (_, value) => onChange('valueIfTrue', value)
          } as ITextFieldProps
        ],
        [
          TextField,
          {
            label: strings.ColumnRenderOptionBooleanFalse,
            placeholder: BooleanColumn.defaultProps.valueIfFalse,
            defaultValue: dataTypeProperties['valueIfFalse'],
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
            placeholder: TagsColumn.defaultProps.valueSeparator,
            value: dataTypeProperties.valueSeparator,
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

interface IUseDataTypeDropdown extends IDropdownProps {
  selectedOption: IColumnDataTypeFieldOption
}

export function useDataTypeDropdown(props: IColumnDataTypeFieldProps) {
  const [selectedOption, setSelectedOption] = useState<IColumnDataTypeFieldOption>(
    _.find(dataTypeOptions, (option) => option.key === props.defaultSelectedKey)
  )

  const onChange = (option?: IColumnDataTypeFieldOption) => {
    if (!option) return
    props.onChange(option.id)
  }

  /**
   * Render function for dropdown options.
   *
   * @param option Option to render
   */
  const onRenderOption: IRenderFunction<IColumnDataTypeFieldOption> = (option) => (
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

  return {
    selectedOption,
    label: strings.ColumnRenderLabel,
    options: dataTypeOptions,
    selectedKey: selectedOption?.key,
    onChange: (_event, option) => setSelectedOption(option),
    onRenderTitle: (options) => onRenderOption(_.first(options)),
    onRenderOption,
    disabled: selectedOption?.disabled
  } as IUseDataTypeDropdown
}
