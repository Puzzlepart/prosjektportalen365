import { IDropdownOption } from '@fluentui/react/lib/Dropdown'
import * as strings from 'PortfolioWebPartsStrings'

export const renderOptions: IDropdownOption[] = [
  {
    key: 'text',
    text: strings.ColumnRenderOptionText
  },
  {
    key: 'note',
    text: strings.ColumnRenderOptionNote
  },
  {
    key: 'number',
    text: strings.ColumnRenderOptionNumber
  },
  {
    key: 'date',
    text: strings.ColumnRenderOptionDate
  },
  {
    key: 'datetime',
    text: strings.ColumnRenderOptionDateTime
  },
  {
    key: 'user',
    text: strings.ColumnRenderOptionUser
  },
  {
    key: 'list',
    text: strings.ColumnRenderOptionList
  },
  {
    key: 'tags',
    text: strings.ColumnRenderOptionTags
  },
  {
    key: 'percentage',
    text: strings.ColumnRenderOptionPercentage
  },
  {
    key: 'trend',
    text: strings.ColumnRenderOptionTrend
  },
  {
    key: 'modal',
    text: strings.ColumnRenderOptionModal
  },
  {
    key: 'filenamewithicon',
    text: strings.ColumnRenderOptionFilenameWithIcon
  }
]
