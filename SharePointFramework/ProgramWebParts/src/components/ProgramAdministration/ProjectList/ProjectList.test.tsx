// The commands and the project logo reach SharePoint and are stubbed; they are mocked before the
// imports, as Heft runs Jest on TypeScript's CommonJS output without hoisting.
jest.mock('../Commands', () => ({ Commands: () => null }))
jest.mock('pp365-shared-library', () => ({
  ...jest.requireActual('pp365-shared-library'),
  ProjectLogo: () => null
}))

import { fireEvent, render, screen } from '@testing-library/react'
import { formatDate } from 'pp365-shared-library'
import * as React from 'react'
import { IProgramAdministrationContext, ProgramAdministrationContext } from '../context'
import { ProjectList } from './ProjectList'
import { IProjectListProps } from './types'

/**
 * The program administration's project list, on the portfolio overview's grid: rows by title with
 * the phase and the creation date, a selection reported as site ids when the user may manage the
 * program, and, when the projects come from more than one hub, one grid with a header row per hub,
 * as the portfolio overview groups. Asserted through roles and text; the row checks are named
 * "Velg rad", the group checks "Velg alle i <hub>" (PortfolioWebPartsStrings).
 */
const HUBS = [
  { url: 'https://t.sharepoint.com/sites/hub1', hubSiteId: 'hub-1', title: 'Hub 1' },
  { url: 'https://t.sharepoint.com/sites/hub2', hubSiteId: 'hub-2', title: 'Hub 2' }
]

const ALFA = {
  SiteId: 'a',
  Title: 'Alfa',
  HubSiteId: 'hub-1',
  SPWebURL: 'https://t.sharepoint.com/sites/alfa',
  Phase: 'Konsept',
  Created: '2024-03-01T09:00:00Z'
}
const BRAVO = { SiteId: 'b', Title: 'Bravo', HubSiteId: 'hub-1' }

/** Ten projects in hub 1: a group that starts closed. */
const MANY = Array.from({ length: 10 }, (_, i) => ({
  SiteId: `p${i}`,
  Title: `Prosjekt ${i + 1}`,
  HubSiteId: 'hub-1'
}))

function renderList({
  props = {} as Partial<IProjectListProps>,
  state = {} as Record<string, any>
} = {}) {
  const onSelectionChange = jest.fn()
  const items = props.items ?? [ALFA, BRAVO]
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
        programHubs={HUBS}
        {...props}
      />
    </ProgramAdministrationContext.Provider>
  )
  return { onSelectionChange }
}

const rowChecks = () => screen.queryAllByRole('checkbox', { name: 'Velg rad' })
const checked = () => rowChecks().map((check) => (check as HTMLInputElement).checked)
const search = (value: string) =>
  fireEvent.change(screen.getByPlaceholderText('Søk'), { target: { value } })
const shownTitles = () =>
  screen.getAllByText(/^(Alfa|Bravo|Charlie)$/).map((element) => element.textContent)

describe('ProjectList', () => {
  it('lists the projects by title', () => {
    renderList()
    expect(shownTitles()).toEqual(['Alfa', 'Bravo'])
  })

  it('shows the phase and the date the project was created', () => {
    renderList()
    expect(screen.getByText('Fase')).toBeInTheDocument()
    expect(screen.getByText('Opprettet')).toBeInTheDocument()
    expect(screen.getByText('Konsept')).toBeInTheDocument()
    expect(screen.getByText(formatDate(ALFA.Created))).toBeInTheDocument()
  })

  it('links the titles on the page, and not in the dialog', () => {
    renderList({ props: { renderLinks: true } })
    expect(screen.getByRole('link', { name: 'Alfa' })).toHaveAttribute('href', ALFA.SPWebURL)
    renderList({ props: { renderLinks: false, items: [{ ...ALFA, Title: 'Charlie' }] } })
    expect(screen.queryByRole('link', { name: 'Charlie' })).toBeNull()
  })

  it('sorts by a column when its header is clicked', () => {
    renderList({ props: { items: [BRAVO, { ...ALFA, Title: 'Charlie' }, ALFA] } })
    expect(shownTitles()).toEqual(['Alfa', 'Bravo', 'Charlie'])
    fireEvent.click(screen.getByText('Tittel'))
    expect(shownTitles()).toEqual(['Charlie', 'Bravo', 'Alfa'])
  })

  it('reports a selection as site ids when the user may manage the program', () => {
    const { onSelectionChange } = renderList()
    fireEvent.click(rowChecks()[1])
    expect(onSelectionChange).toHaveBeenLastCalledWith(['b'])
  })

  it('offers no selection when the user may not manage the program', () => {
    renderList({ state: { userHasManagePermission: false } })
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('shows the rows given as selected', () => {
    renderList({ props: { selectedItems: ['b'] } })
    expect(checked()).toEqual([false, true])
  })

  it('keeps a selection a search hides, so projects chosen in several searches are all added', () => {
    const { onSelectionChange } = renderList({ props: { selectedItems: ['a'] } })
    search('bra')
    expect(shownTitles()).toEqual(['Bravo'])
    fireEvent.click(rowChecks()[0])
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b'])
  })

  it('shows the empty message when the program has no child projects', () => {
    renderList({ props: { items: [] } })
    expect(screen.getByText('Ingen områder er koblet til programmet.')).toBeInTheDocument()
  })

  it('groups the projects per hub in one grid, opens small groups at once and large ones on click', () => {
    renderList({
      props: { items: [...MANY, { ...BRAVO, HubSiteId: 'hub-2' }], defaultGroupsExpanded: false }
    })
    expect(screen.getAllByRole('grid')).toHaveLength(1)
    expect(screen.getByText('Hub 1')).toBeInTheDocument()
    expect(screen.getByText('(10)')).toBeInTheDocument()
    expect(screen.queryByText('Prosjekt 1')).toBeNull()
    expect(screen.getByText('Bravo')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Hub 1'))
    expect(screen.getByText('Prosjekt 1')).toBeInTheDocument()
  })

  it('opens every group while a search is active', () => {
    renderList({
      props: { items: [...MANY, { ...BRAVO, HubSiteId: 'hub-2' }], defaultGroupsExpanded: false }
    })
    search('pro')
    expect(screen.getByText('Prosjekt 1')).toBeInTheDocument()
  })

  it("keeps the other groups' selections when one group changes, and selects a hub's projects by its check", () => {
    const { onSelectionChange } = renderList({
      props: {
        items: [ALFA, { ...BRAVO, HubSiteId: 'hub-2' }],
        defaultGroupsExpanded: true,
        selectedItems: ['a']
      }
    })
    expect(checked()).toEqual([true, false])
    fireEvent.click(rowChecks()[1])
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b'])
    onSelectionChange.mockClear()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Velg alle i Hub 2' }))
    expect(onSelectionChange).toHaveBeenCalledWith(['a', 'b'])
  })
})
