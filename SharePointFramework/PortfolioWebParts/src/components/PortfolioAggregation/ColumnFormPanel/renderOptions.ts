import { IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown'
import * as strings from 'PortfolioWebPartsStrings'

export const renderOptions: IDropdownOption[] = [
  {
    key: 'text',
    text: strings.ColumnRenderOptionText
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
  }
]
