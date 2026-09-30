// The data hook reaches SharePoint, the status element needs the whole report context, and the two
// matrices are heavy; all are mocked before the component is imported.
const mockFetchListData = jest.fn()
jest.mock('../ListSection/useFetchListData', () => ({ useFetchListData: () => mockFetchListData }))
jest.mock('../../StatusElement', () => ({ StatusElement: () => null }))
jest.mock('../../../RiskMatrix', () => ({ RiskMatrix: () => <div>risikomatrise</div> }))
jest.mock('../../../OpportunityMatrix', () => ({
  OpportunityMatrix: () => <div>mulighetsmatrise</div>
}))
jest.mock('../../../../models', () => ({
  UncertaintyElementModel: function (item: any) {
    return item
  }
}))

import { render, screen } from '@testing-library/react'
import * as React from 'react'
import * as strings from 'ProjectWebPartsStrings'
import { ProjectStatusContext } from '../../context'
import { SectionContext } from '../context'
import { UncertaintySection } from './UncertaintySection'

/**
 * A status report section that lists risks or opportunities and draws their matrix. The matrix is
 * chosen from the items' content type; the list below it is asserted through text, so it holds
 * whichever Fluent UI list draws the rows.
 */

/**
 * The content type id's characters 38 to 40 pick the matrix: 01 is risk, 02 is opportunity.
 */
const contentType = (index: '01' | '02') => ({
  Id: { StringValue: `0x0100${'0'.repeat(32)}${index}` }
})

const columns = [
  { key: 'Title', fieldName: 'Title', name: 'Tittel', minWidth: 100 },
  { key: 'GtRiskProbability', fieldName: 'GtRiskProbability', name: 'Sannsynlighet', minWidth: 80 }
]

function renderSection() {
  render(
    <ProjectStatusContext.Provider
      value={
        {
          state: { isDataLoaded: true, selectedReport: {}, selectedScope: '' },
          props: { riskMatrix: {}, opportunityMatrix: {}, pageContext: {} },
          dispatch: jest.fn()
        } as any
      }
    >
      <SectionContext.Provider value={{ section: { id: 'usikkerhet', sumField: [] } as any }}>
        <UncertaintySection />
      </SectionContext.Provider>
    </ProjectStatusContext.Provider>
  )
}

describe('UncertaintySection', () => {
  beforeEach(() => mockFetchListData.mockReset())

  it('lists the items under their column names', async () => {
    mockFetchListData.mockResolvedValue({
      columns,
      items: [{ Title: 'Forsinkelse', GtRiskProbability: '3', ContentType: contentType('01') }]
    })
    renderSection()
    expect(await screen.findByText('Tittel')).toBeInTheDocument()
    expect(screen.getByText('Sannsynlighet')).toBeInTheDocument()
    expect(screen.getByText('Forsinkelse')).toBeInTheDocument()
  })

  it('draws the risk matrix for risks', async () => {
    mockFetchListData.mockResolvedValue({
      columns,
      items: [{ Title: 'Forsinkelse', ContentType: contentType('01') }]
    })
    renderSection()
    expect(await screen.findByText('risikomatrise')).toBeInTheDocument()
  })

  it('draws the opportunity matrix for opportunities', async () => {
    mockFetchListData.mockResolvedValue({
      columns,
      items: [{ Title: 'Gevinst', ContentType: contentType('02') }]
    })
    renderSection()
    expect(await screen.findByText('mulighetsmatrise')).toBeInTheDocument()
  })

  it('says so when the data cannot be fetched', async () => {
    mockFetchListData.mockRejectedValue(new Error('403'))
    renderSection()
    expect(await screen.findByText(strings.ListSectionDataErrorMessage)).toBeInTheDocument()
  })
})
