import { IRenderFunction, ITextFieldProps, IToggleProps, Icon, TextField, Toggle } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { ColumnRenderFieldOption, IColumnRenderFieldProps } from './types'
import React from 'react'

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
            id: 'Date',
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
            key: 'datetime',
            id: 'DateTime',
            text: strings.ColumnRenderOptionDateTime,
            data: {
                iconProps: { iconName: 'DateTime' },
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
            data: { iconProps: { iconName: 'Tag' } }
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
        },
        {
            key: 'trend',
            id: 'Trend',
            text: strings.ColumnRenderOptionTrend,
            data: { iconProps: { iconName: 'Trending12' } },
            disabled: true
        },
        {
            key: 'modal',
            id: 'Modal',
            text: strings.ColumnRenderOptionModal,
            data: { iconProps: { iconName: 'WindowEdit' } },
            disabled: true
        },
        {
            key: 'filename_with_icon',
            id: 'Filename with icon',
            text: strings.ColumnRenderOptionFilenameWithIcon,
            data: { iconProps: { iconName: 'FileImage' } }
        },
        {
            key: 'list',
            id: 'List',
            text: strings.ColumnRenderOptionList,
            data: { iconProps: { iconName: 'List' } }
        }
    ]

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

    return { renderAsOptions, onChange, onRenderOption }
}