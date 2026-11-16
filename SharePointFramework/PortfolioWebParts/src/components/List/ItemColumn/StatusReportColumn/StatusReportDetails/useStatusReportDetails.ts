import { mergeClasses } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { getFluentIconWithFallback } from 'pp365-shared-library'
import styles from './StatusReportDetails.module.scss'
import { IStatusReportDetailsProps } from './types'

/** The sections' icons: 20 px, the catalog's grid, where its icons are sharp. */
const SECTION_ICON_SIZE = 20

/**
 * Component logic hook for `StatusReportDetails`: each section with its icon, and its value or
 * that it has none.
 */
export function useStatusReportDetails(props: IStatusReportDetailsProps) {
  const sections = props.report.sections.map((section) => ({
    ...section,
    icon: getFluentIconWithFallback(section.iconName, { size: SECTION_ICON_SIZE }),
    valueText: section.value ?? strings.StatusSectionNoValueLabel,
    valueClassName: mergeClasses(styles.value, !section.value && styles.noValue)
  }))
  return { sections }
}
