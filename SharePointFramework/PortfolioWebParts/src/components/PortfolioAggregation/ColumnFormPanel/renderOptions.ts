import { IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown'
import * as strings from 'PortfolioWebPartsStrings'

export const renderOptions: IDropdownOption[] = [
  {
    key: 'text',
    text: strings.ColumnRenderOptionText
  },
  {
    key: 'int',
    text: strings.ColumnRenderOptionInt
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
  }
]
