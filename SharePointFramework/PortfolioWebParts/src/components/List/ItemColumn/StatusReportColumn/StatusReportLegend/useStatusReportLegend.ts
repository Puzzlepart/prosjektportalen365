import { CSSProperties } from 'react'
import { getSectionAbbreviations } from '../getSectionAbbreviations'
import { IStatusReportLegendProps } from './types'

/**
 * Component logic hook for `StatusReportLegend`: each section's two letters, with its name for
 * the pointer, in as many 20 px tracks as the strips have tiles.
 */
export function useStatusReportLegend(props: IStatusReportLegendProps) {
  const abbreviations = getSectionAbbreviations(props.sections.map(({ name }) => name))
  const entries = props.sections.map(({ fieldName, name }, index) => ({
    key: fieldName,
    name,
    abbreviation: abbreviations[index]
  }))
  return { entries, style: { '--n': entries.length } as CSSProperties }
}
