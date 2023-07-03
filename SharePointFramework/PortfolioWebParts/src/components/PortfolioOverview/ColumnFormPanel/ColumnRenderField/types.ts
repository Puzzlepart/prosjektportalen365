import { IDropdownOption, IDropdownProps } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'

export interface IColumnRenderFieldProps extends Pick<IDropdownProps, 'defaultSelectedKey'> {
  onChange: (value: string) => void
}

export const renderAsOptions: IDropdownOption[] = [
  {
    key: 'text',
    text: strings.ColumnRenderOptionText,
    data: { iconProps: { iconName: 'FontColor' } }
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
    key: 'date',
    text: strings.ColumnRenderOptionDate,
    data: { iconProps: { iconName: 'Calendar' } }
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
  }
]
