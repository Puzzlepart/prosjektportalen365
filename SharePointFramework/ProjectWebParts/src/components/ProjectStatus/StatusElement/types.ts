import { ISummation } from '../Sections/ListSection'

export interface IStatusElement {
  label?: string
  value?: string
  comment?: string
  iconName?: string
  height?: string | number
  iconSize?: number
  iconColor?: string
}

export interface IStatusElementProps extends Pick<IStatusElement, 'iconSize'> {
  /**
   * Truncate comment to the specified length and add ellipsis (...)
   */
  truncateComment?: number

  /**
   * Show only icons
   */
  iconsOnly?: boolean

  /**
   * Summation with result and description
   */
  summation?: ISummation

  /**
   * The element heads a section of the report: its label is the section's heading (an `h3`).
   * Elsewhere, as in the summary among the other sections' elements, it is plain text.
   */
  asHeading?: boolean
}
