import { IPanelProps } from '@fluentui/react'
import { OptionProps } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { ProjectColumn } from 'pp365-shared-library'

export interface IColumnFormPanel extends Pick<IPanelProps, 'isOpen'> {
  column?: ProjectColumn
}

export const visibilityOptions: OptionProps[] = [
  {
    value: 'ProjectStatus',
    text: strings.ShowFieldProjectStatusLabel
  },
  {
    value: 'Frontpage',
    text: strings.ShowFieldFrontpageLabel
  },
  {
    value: 'Portfolio',
    text: strings.ShowFieldPortfolioLabel
  }
]
