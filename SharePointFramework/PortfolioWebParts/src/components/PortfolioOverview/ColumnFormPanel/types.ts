import { OptionProps } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { ProjectColumn } from 'pp365-shared-library'

export interface IColumnFormPanel {
  /**
   * Whether the panel is showing. This is component state, so it keeps its own
   * name rather than tracking the panel's `open` prop.
   */
  isOpen?: boolean
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
