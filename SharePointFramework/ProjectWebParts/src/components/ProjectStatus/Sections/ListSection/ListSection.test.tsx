// The data hook reaches SharePoint and the status element needs the whole report context, so both
// are mocked before the component is imported; see .development-guide/spfx/testing.md on ordering.
const mockFetchListData = jest.fn()
jest.mock('./useFetchListData', () => ({ useFetchListData: () => mockFetchListData }))
jest.mock('../../StatusElement', () => ({ StatusElement: () => null }))

import { render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import * as strings from 'ProjectWebPartsStrings'
import { ProjectStatusContext } from '../../context'
import { SectionContext } from '../context'
import { ListSection } from './ListSection'

/**
 * A status report section that lists items from a SharePoint list: its columns and rows once the
 * data arrives, its error when it does not, and the persisted copy when the report was already
 * rendered. Asserted through text, so it holds whichever Fluent UI list draws the rows.
 */

const data = {
  columns: [
    { key: 'Title', fieldName: 'Title', name: 'Tittel', minWidth: 100 },
    { key: 'Status', fieldName: 'Status', name: 'Status', minWidth: 80 }
  ],
  items: [
    { Title: 'Leveranse A', Status: 'Pågår' },
    { Title: 'Leveranse B', Status: 'Ferdig' }
  ]
}

function renderSection({ persisted = undefined as Record<string, any> } = {}) {
  const dispatch = jest.fn()
  render(
    <ProjectStatusContext.Provider
      value={
        {
          state: {
            isDataLoaded: true,
            selectedReport: { persistedSectionData: persisted },
            selectedScope: ''
          },
          props: {},
          dispatch
        } as any
      }
    >
      <SectionContext.Provider value={{ section: { id: 'leveranser', sumField: [] } as any }}>
        <ListSection />
      </SectionContext.Provider>
    </ProjectStatusContext.Provider>
  )
  return { dispatch }
}

describe('ListSection', () => {
  beforeEach(() => mockFetchListData.mockReset())

  it('lists the items under their column names once the data arrives', async () => {
    mockFetchListData.mockResolvedValue(data)
    renderSection()
    expect(await screen.findByText('Tittel')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Leveranse A')).toBeInTheDocument()
    expect(screen.getByText('Ferdig')).toBeInTheDocument()
  })

  it('remembers the data on the report so the next render does not fetch', async () => {
    mockFetchListData.mockResolvedValue(data)
    const { dispatch } = renderSection()
    await screen.findByText('Leveranse A')
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: expect.objectContaining({ data: expect.anything() }) })
    )
  })

  it('renders from the persisted copy without fetching', async () => {
    renderSection({ persisted: { leveranser: data } })
    expect(await screen.findByText('Leveranse B')).toBeInTheDocument()
    expect(mockFetchListData).not.toHaveBeenCalled()
  })

  it('shows nothing but the summary when the list is empty', async () => {
    mockFetchListData.mockResolvedValue(null)
    renderSection()
    await waitFor(() => expect(mockFetchListData).toHaveBeenCalled())
    expect(screen.queryByText('Tittel')).toBeNull()
    expect(screen.queryByText(strings.ListSectionDataErrorMessage)).toBeNull()
  })

  it('says so when the data cannot be fetched', async () => {
    mockFetchListData.mockRejectedValue(new Error('403'))
    renderSection()
    expect(await screen.findByText(strings.ListSectionDataErrorMessage)).toBeInTheDocument()
  })
})
