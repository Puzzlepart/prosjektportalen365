import { render } from '@testing-library/react'
import { SectionModel } from 'pp365-shared-library/lib/models'
import * as React from 'react'
import { ProjectStatusContext } from '../context'
import { PROPERTIES_SECTION_CT, report, section } from '../testFixtures'
import { useSections } from './useSections'

/**
 * Which sections the status page shows for a report: those with a value or comment (or, for a
 * project properties section, a field with text), those configured as sections (the summary
 * always), and scoped sections only when a report series is selected.
 */
function sectionsFor(state: Record<string, any>): SectionModel[] {
  const captured: { sections: SectionModel[] } = { sections: [] }
  const Probe: React.FC = () => {
    captured.sections = useSections()
    return null
  }
  render(
    <ProjectStatusContext.Provider
      value={
        {
          state: { isDataLoaded: true, selectedScope: '', ...state },
          props: {},
          dispatch: jest.fn()
        } as any
      }
    >
      <Probe />
    </ProjectStatusContext.Provider>
  )
  return captured.sections
}

const names = (sections: SectionModel[]) => sections.map((s) => s.name)

describe('useSections', () => {
  it('shows the sections with a value or a comment', () => {
    const sections = [
      section(1, 'Fremdrift', 'GtStatusTime'),
      section(2, 'Økonomi', 'GtStatusBudget'),
      section(3, 'Risiko', 'GtStatusRisk')
    ]
    const selectedReport = report({ GtStatusTime: 'Grønn', GtStatusRiskComment: 'Se matrisen' })
    expect(names(sectionsFor({ data: { sections }, selectedReport }))).toEqual([
      'Fremdrift',
      'Risiko'
    ])
  })

  it('shows a project properties section when one of its fields has text', () => {
    const sections = [
      section(1, 'Prosjektinformasjon', 'GtStatusInfo', PROPERTIES_SECTION_CT, {
        GtSecViewFields: 'GtProjectOwner,GtProjectManager'
      }),
      section(2, 'Tomt', 'GtStatusEmpty', PROPERTIES_SECTION_CT, { GtSecViewFields: 'GtBudget' })
    ]
    const selectedReport = report({ GtProjectOwner: 'Kari Nordmann' })
    expect(names(sectionsFor({ data: { sections }, selectedReport }))).toEqual([
      'Prosjektinformasjon'
    ])
  })

  it('leaves out a section not configured to show, unless it is the summary', () => {
    const sections = [
      section(1, 'Overordnet status', 'GtOverallStatus', undefined, { GtSecShowAsSection: false }),
      section(2, 'Fremdrift', 'GtStatusTime', undefined, { GtSecShowAsSection: false })
    ]
    const selectedReport = report({ GtOverallStatus: 'Bra', GtStatusTime: 'Grønn' })
    expect(names(sectionsFor({ data: { sections }, selectedReport }))).toEqual([
      'Overordnet status'
    ])
  })

  it('hides a scoped section for the default series and shows it for a selected series', () => {
    const sections = [
      section(1, 'Leveranser', 'GtStatusDeliveries', undefined, { GtSecList: 'Leveranser {scope}' })
    ]
    const selectedReport = report({ GtStatusDeliveries: 'Grønn' })
    expect(names(sectionsFor({ data: { sections }, selectedReport }))).toEqual([])
    expect(
      names(sectionsFor({ data: { sections }, selectedReport, selectedScope: 'DP1' }))
    ).toEqual(['Leveranser'])
  })

  it('returns the sections as they are while the data loads', () => {
    const sections = [section(1, 'Fremdrift', 'GtStatusTime')]
    expect(sectionsFor({ isDataLoaded: false, data: { sections } })).toBe(sections)
  })
})
