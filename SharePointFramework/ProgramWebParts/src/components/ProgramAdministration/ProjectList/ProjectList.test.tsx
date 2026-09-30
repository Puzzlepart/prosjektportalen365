// The list's hook derives groups and filtering from the props; it is mocked before the import so
// the test controls the rows and the grouping. The commands and the project logo reach SharePoint
// and are stubbed.
const mockUseProjectList = jest.fn()
jest.mock('./useProjectList', () => ({ useProjectList: (props: any) => mockUseProjectList(props) }))
jest.mock('../Commands', () => ({ Commands: () => null }))
jest.mock('pp365-shared-library', () => ({
  ...jest.requireActual('pp365-shared-library'),
  ProjectLogo: () => null
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { IProgramAdministrationContext, ProgramAdministrationContext } from '../context'
import { ProjectList } from './ProjectList'

/**
 * The program administration's project list: rows by title, a selection reported as site ids when
 * the user may manage the program, and one collapsible group per hub when the projects span
 * several. Asserted through roles and text, so it holds whichever grid draws the rows.
 */
const items = [
  { SiteId: 'a', Title: 'Alfa', HubSiteId: 'hub-1' },
  { SiteId: 'b', Title: 'Bravo', HubSiteId: 'hub-2' }
]

function renderList({
  hook = {} as Record<string, any>,
  state = {} as Record<string, any>,
  props = {} as Record<string, any>
} = {}) {
  const onSelectionChange = jest.fn()
  mockUseProjectList.mockReturnValue({
    items,
    columns: jest.requireActual('./useColumns').useColumns(false),
    defaultSortState: { sortColumn: 'title', sortDirection: 'ascending' },
    onSearch: jest.fn(),
    searchTerm: '',
    groupedData: null,
    shouldEnableGrouping: false,
    ...hook
  })
  const value = {
    props: {},
    state: { childProjects: items, loading: false, userHasManagePermission: true, ...state },
    dispatch: jest.fn()
  } as unknown as IProgramAdministrationContext
  render(
    <ProgramAdministrationContext.Provider value={value}>
      <ProjectList
        items={items}
        onSelectionChange={onSelectionChange}
        search={{ placeholder: 'Søk' }}
        {...props}
      />
    </ProgramAdministrationContext.Provider>
  )
  return { onSelectionChange }
}

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('ProjectList', () => {
  it('lists the projects by title', () => {
    renderList()
    expect(screen.getByText('Alfa')).toBeInTheDocument()
    expect(screen.getByText('Bravo')).toBeInTheDocument()
  })

  it('reports a selection as site ids when the user may manage the program', async () => {
    const user = setupUser()
    const { onSelectionChange } = renderList()
    // The first checkbox selects all; the rest are one per row, in row order.
    await user.click(screen.getAllByRole('checkbox')[2])
    expect(onSelectionChange).toHaveBeenLastCalledWith(['b'])
  })

  it('offers no selection when the user may not manage the program', () => {
    renderList({ state: { userHasManagePermission: false } })
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('groups the projects per hub and opens a group on click', async () => {
    const user = setupUser()
    renderList({
      hook: {
        shouldEnableGrouping: true,
        groupedData: { 'Hub 1': [items[0]], 'Hub 2': [items[1]] }
      },
      props: { defaultGroupsExpanded: false }
    })
    expect(screen.getByText('Hub 1')).toBeInTheDocument()
    expect(screen.queryByText('Alfa')).toBeNull()
    await user.click(screen.getByText('Hub 1'))
    expect(screen.getByText('Alfa')).toBeInTheDocument()
    expect(screen.queryByText('Bravo')).toBeNull()
  })
})
