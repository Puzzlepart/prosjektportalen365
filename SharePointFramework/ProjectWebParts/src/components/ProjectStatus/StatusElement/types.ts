import { ISummation } from '../Sections/ListSection'

/** Status label, value, comment and icon presentation for a report section. */
export interface IStatusElement {
  label?: string
  value?: string
  comment?: string
  iconName?: string
  height?: string | number
  iconSize?: number
  iconColor?: string

  /**
   * The status value's own icon (`GtPortfolioColumnIconName` in `Prosjektkolonnekonfigurasjon`),
   * which the mark beside the section's icon takes as its shape.
   */
  statusIconName?: string
}

/** Controls status text, comment truncation and aggregate presentation. */
export interface IStatusElementProps extends Pick<IStatusElement, 'iconSize'> {
  /**
   * Truncate comment to the specified length and add ellipsis (...)
   */
  truncateComment?: number

  /**
   * Show only icons
   */
  iconsOnly?: boolean

  summation?: ISummation

  /**
   * The element heads a section of the report: its label is the section's heading (an `h3`).
   * Elsewhere, as in the summary among the other sections' elements, it is plain text.
   */
  asHeading?: boolean
}
