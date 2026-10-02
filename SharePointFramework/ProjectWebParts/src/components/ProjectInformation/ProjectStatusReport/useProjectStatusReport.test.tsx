import { render } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { ProjectInformationContextProvider } from '../context'
import { useProjectStatusReport } from './useProjectStatusReport'

/**
 * The latest report per series shown under the properties: the default series first, then each
 * sub-project's, each with its own status text; none when the web part hides the report.
 */
const report = (id: number, scopeKey: string, published = true) =>
  ({
    id,
    scopeKey,
    published,
    publishedDate: new Date('2026-09-01T08:00:00Z'),
    modified: new Date('2026-09-02T08:00:00Z')
  }) as any

function contexts(reports: any[], props: Record<string, any> = {}) {
  const captured: { value: any[] } = { value: [] }
  const Probe: React.FC = () => {
    captured.value = useProjectStatusReport()
    return null
  }
  render(
    <ProjectInformationContextProvider
      value={{ props, state: { data: { reports }, activePanel: 'x' }, dispatch: jest.fn() } as any}
    >
      <Probe />
    </ProjectInformationContextProvider>
  )
  return captured.value
}

describe('useProjectStatusReport', () => {
  it('gives one context per series, the default first, each with the newest report', () => {
    // Newest first, as the data comes.
    const result = contexts([
      report(5, 'DP1'),
      report(4, ''),
      report(3, 'dp1'),
      report(2, 'DP2', false),
      report(1, '')
    ])
    expect(result.map((c) => c.state.selectedReport.id)).toEqual([4, 5, 2])
    expect(result.map((c) => c.state.selectedScope)).toEqual(['', 'DP1', 'DP2'])
    expect(result[0].props.title).toBe(strings.ProjectInformationStatusReportHeaderText)
    expect(result[0].state.reportStatus).toContain(
      strings.PublishedStatusReport.split('{0}')[0].trim()
    )
    expect(result[2].state.reportStatus).toContain(
      strings.NotPublishedStatusReport.split('{0}')[0].trim()
    )
    expect(result[0].state.activePanel).toBeUndefined()
  })

  it('gives none when the report is hidden or there is no report', () => {
    expect(contexts([report(1, '')], { hideStatusReport: true })).toEqual([])
    expect(contexts([])).toEqual([])
  })
})
