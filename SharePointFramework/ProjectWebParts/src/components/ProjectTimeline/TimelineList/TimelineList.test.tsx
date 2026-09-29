// The toolbar hook reaches SharePoint through the data adapter, so it is mocked before the
// component is imported.
jest.mock('./useToolbarItems', () => ({
  useToolbarItems: () => ({ menuItems: [], farMenuItems: [] })
}))

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { ProjectTimelineContext } from '../context'
import { TimelineList } from './TimelineList'

/**
 * The timeline's list view: the timeline items under the columns the list defines, with typed
 * cells, sorting and selection. Asserted through roles and text, so it holds whichever grid renders
 * the rows.
 */

const listColumns = [
  { key: 'Title', fieldName: 'Title', name: 'Tittel', minWidth: 100, maxWidth: 200, data: { type: 'Text' } },
  { key: 'GtStartDate', fieldName: 'GtStartDate', name: 'Start', minWidth: 80, data: { type: 'DateTime' } },
  { key: 'GtBudget', fieldName: 'GtBudget', name: 'Budsjett', minWidth: 80, data: { type: 'Number' } },
  { key: 'GtOwner', fieldName: 'GtOwner', name: 'Eier', minWidth: 120, data: { type: 'User' } }
]

const listItems = [
  {
    Title: 'Milepæl B',
    GtStartDate: '2026-03-15T00:00:00Z',
    GtBudget: '2500',
    GtOwner: { Title: 'Kari Nordmann', EMail: 'kari@contoso.no' }
  },
  { Title: 'Milepæl A', GtStartDate: '2026-01-05T00:00:00Z', GtBudget: '100', GtOwner: null }
]

function renderList() {
  const setState = jest.fn()
  render(
    <ProjectTimelineContext.Provider
      value={
        {
          props: { showTimelineListCommands: false },
          state: { data: { listItems, listColumns }, selectedItems: [] },
          setState
        } as any
      }
    >
      <TimelineList />
    </ProjectTimelineContext.Provider>
  )
  return { setState }
}

/**
 * The first cell of each row, in the order the rows show them.
 */
const rowTitles = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.querySelectorAll('[role=gridcell]')[1]?.textContent.trim())

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('TimelineList', () => {
  it('shows the columns the list defines', () => {
    renderList()
    for (const column of listColumns) {
      expect(screen.getByText(column.name)).toBeInTheDocument()
    }
  })

  it('shows the items sorted by title', () => {
    renderList()
    expect(rowTitles()).toEqual(['Milepæl A', 'Milepæl B'])
  })

  it('formats dates, numbers and people by the column type', () => {
    renderList()
    expect(screen.getByText('15.03.2026')).toBeInTheDocument()
    expect(screen.getByText('2500')).toBeInTheDocument()
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument()
  })

  it('sorts by another column when its header is clicked', async () => {
    const user = setupUser()
    renderList()
    await user.click(screen.getByText('Budsjett'))
    expect(rowTitles()).toEqual(['Milepæl A', 'Milepæl B'])
    await user.click(screen.getByText('Budsjett'))
    expect(rowTitles()).toEqual(['Milepæl B', 'Milepæl A'])
  })

  it('reports the rows the user selects', async () => {
    const user = setupUser()
    const { setState } = renderList()
    const checkboxes = screen.getAllByRole('checkbox')
    // The first checkbox selects all; the rest are one per row.
    await user.click(checkboxes[1])
    await waitFor(() =>
      expect(setState).toHaveBeenCalledWith({ selectedItems: expect.arrayContaining([expect.anything()]) })
    )
    expect(setState.mock.calls[setState.mock.calls.length - 1][0].selectedItems).toHaveLength(1)
  })
})
