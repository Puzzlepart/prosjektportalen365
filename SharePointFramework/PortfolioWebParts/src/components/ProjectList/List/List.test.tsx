// The row menu needs the data adapter and the whole web part context, so it is mocked before the
// component is imported.
jest.mock('../ProjectMenu', () => ({ ProjectMenu: () => null }))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import * as strings from 'PortfolioWebPartsStrings'
import { List } from './List'
import { IListContext, ListContext } from './context'

/**
 * The project list's list view: one row per project with its title, phase and people, sorted by
 * title, sortable by the other columns. Asserted through roles and text, so it holds whichever
 * grid renders the rows.
 */

function project(title: string, overrides: Record<string, any> = {}) {
  return {
    title,
    url: `/sites/${title.toLowerCase()}`,
    hasUserAccess: true,
    phase: 'Gjennomføring',
    data: {},
    primaryUser: { name: 'Kari Nordmann' },
    secondaryUser: { name: 'Ola Nordmann' },
    ...overrides
  }
}

function renderList(projects: any[], context: Partial<IListContext> = {}) {
  render(
    <ListContext.Provider
      value={
        {
          projects,
          projectColumns: [],
          size: 'medium',
          shouldDisplay: () => true,
          ...context
        } as IListContext
      }
    >
      <List />
    </ListContext.Provider>
  )
}

/**
 * The project titles in the order the rows show them.
 */
const rowTitles = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.querySelector('a, span')?.textContent)

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('ProjectList list view', () => {
  it('shows the projects sorted by title', () => {
    renderList([project('Bravo'), project('Alfa')])
    expect(screen.getByText(strings.TitleLabel)).toBeInTheDocument()
    expect(rowTitles()).toEqual(['Alfa', 'Bravo'])
  })

  it('links the title to the project when the user has access, and shows plain text otherwise', () => {
    renderList([project('Alfa'), project('Bravo', { hasUserAccess: false })])
    expect(screen.getByRole('link', { name: 'Alfa' })).toHaveAttribute('href', '/sites/alfa')
    expect(screen.queryByRole('link', { name: 'Bravo' })).toBeNull()
    expect(screen.getByText('Bravo')).toBeInTheDocument()
  })

  it('shows the phase and the people', () => {
    renderList([project('Alfa', { phase: 'Konsept' })])
    expect(screen.getByText(strings.PhaseLabel)).toBeInTheDocument()
    expect(screen.getByText('Konsept')).toBeInTheDocument()
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument()
    expect(screen.getByText('Ola Nordmann')).toBeInTheDocument()
  })

  it('sorts by phase when its header is clicked', async () => {
    const user = setupUser()
    renderList([project('Alfa', { phase: 'Realisering' }), project('Bravo', { phase: 'Konsept' })])
    await user.click(screen.getByText(strings.PhaseLabel))
    expect(rowTitles()).toEqual(['Bravo', 'Alfa'])
  })

  it('leaves out the columns the web part hides', () => {
    renderList([project('Alfa')], { shouldDisplay: (key) => key !== 'ProjectPhase' })
    expect(screen.queryByText(strings.PhaseLabel)).toBeNull()
    expect(screen.getByText(strings.TitleLabel)).toBeInTheDocument()
  })
})
