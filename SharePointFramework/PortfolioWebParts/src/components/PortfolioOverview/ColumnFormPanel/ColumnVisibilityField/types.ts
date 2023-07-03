import { IDropdownOption, IDropdownProps } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'

export interface IColumnVisibilityFieldProps extends Pick<IDropdownProps, 'defaultSelectedKeys'> {
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
