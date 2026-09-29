// The status elements read the whole report through their own hook, and the project information
// block reaches SharePoint; both are mocked before the component is imported, along with the hook
// that derives each section's header, so the test controls which sections have a value.
jest.mock('../../StatusElement', () => {
  const React = jest.requireActual('react')
  const { SectionContext } = jest.requireActual('../context')
  return {
    StatusElement: () => {
      const { headerProps } = React.useContext(SectionContext)
      return React.createElement('div', null, headerProps.label)
    }
  }
})
jest.mock('../../../ProjectInformation', () => ({
  ProjectInformation: () => {
    const React = jest.requireActual('react')
    return React.createElement('div', null, 'Prosjektinformasjon')
  }
}))
jest.mock('../useCreateContextValue', () => ({
  useCreateContextValue: () => (section: any) => ({
    section,
    headerProps: { label: section.name, value: section.value }
  })
}))

import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { ProjectStatusContext } from '../../context'
import { SummarySection } from './SummarySection'

/**
 * The report's summary: a status element for every section that has a value, or that is the
 * overall status, laid out beside the project information when that is shown. Asserted through
 * text, so it holds whatever grid draws the layout — which jsdom cannot see anyway.
 */
const sections = [
  {
    id: 1,
    name: 'Overordnet status',
    fieldName: 'GtOverallStatus',
    showInStatusSection: true,
    value: ''
  },
  {
    id: 2,
    name: 'Fremdrift',
    fieldName: 'GtStatusTime',
    showInStatusSection: true,
    value: 'Grønn'
  },
  { id: 3, name: 'Økonomi', fieldName: 'GtStatusBudget', showInStatusSection: true, value: '' },
  { id: 4, name: 'Skjult', fieldName: 'GtStatusHidden', showInStatusSection: false, value: 'Gul' }
]

function renderSummary(props: Record<string, any> = {}) {
  render(
    <ProjectStatusContext.Provider
      value={
        {
          state: { isDataLoaded: true, data: { sections }, selectedScope: '' },
          props: { siteId: 'x', webAbsoluteUrl: '/sites/x', spfxContext: {} },
          dispatch: jest.fn()
        } as any
      }
    >
      <SummarySection {...props} />
    </ProjectStatusContext.Provider>
  )
}

describe('SummarySection', () => {
  it('shows a status element for the overall status and for every section with a value', () => {
    renderSummary()
    expect(screen.getByText('Overordnet status')).toBeInTheDocument()
    expect(screen.getByText('Fremdrift')).toBeInTheDocument()
    expect(screen.queryByText('Økonomi')).toBeNull()
  })

  it('leaves out sections not meant for the summary', () => {
    renderSummary()
    expect(screen.queryByText('Skjult')).toBeNull()
  })

  it('shows the project information beside the status when asked to', () => {
    renderSummary({ showProjectInformation: true })
    expect(screen.getByText('Prosjektinformasjon')).toBeInTheDocument()
  })

  it('shows only the status when the project information is not asked for', () => {
    renderSummary({ showProjectInformation: false })
    expect(screen.queryByText('Prosjektinformasjon')).toBeNull()
  })
})
