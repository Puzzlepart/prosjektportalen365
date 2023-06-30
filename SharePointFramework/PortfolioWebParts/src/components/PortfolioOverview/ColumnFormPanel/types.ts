import { IDropdownOption } from '@fluentui/react/lib/Dropdown'
import * as strings from 'PortfolioWebPartsStrings'

export const renderAsOptions: IDropdownOption[] = [
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
    key: 'filename_with_icon',
    text: strings.ColumnRenderOptionFilenameWithIcon
  }
]

export const visibilityOptions: IDropdownOption[] = [
  {
    key: 'GtShowFieldProjectStatus',
    text: strings.ShowFieldProjectStatusLabel
  },
  {
    key: 'GtShowFieldFrontpage',
    text: strings.ShowFieldFrontpageLabel
  },
  {
    key: 'GtShowFieldPortfolio',
    text: strings.ShowFieldPortfolioLabel
  }
]
