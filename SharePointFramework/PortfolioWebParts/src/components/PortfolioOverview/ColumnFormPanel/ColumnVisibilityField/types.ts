import { IDropdownOption } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'

export interface IColumnVisibilityFieldProps {
  onChange: (selection: string[]) => void
}

export const visibilityOptions: IDropdownOption[] = [
  {
    key: 'ProjectStatus',
    text: strings.ShowFieldProjectStatusLabel
  },
  {
    key: 'Frontpage',
    text: strings.ShowFieldFrontpageLabel
  },
  {
    key: 'Portfolio',
    text: strings.ShowFieldPortfolioLabel
  }
]
