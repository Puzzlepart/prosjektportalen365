// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch is replaced by what each test puts in `fetched`.
const fetched: { state: Record<string, any> } = { state: {} }
jest.mock('./useProjectListDataFetch', () => ({
  useProjectListDataFetch: (_props: any, setState: (state: any) => void) => {
    const { useEffect } = jest.requireActual('react')
    useEffect(() => {
      setState(fetched.state)
    }, [])
  }
}))
jest.mock('./ProjectMenu', () => ({ ProjectMenu: () => null }))
jest.mock('pp365-projectwebparts/lib/components/ProjectInformationPanel', () => ({
  ProjectInformationPanel: () => null
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { ProjectList } from './ProjectList'

/**
 * The project list web part as a whole: a tab per vertical the user may see, the default
 * vertical's projects, switching vertical, the search, and the empty and error states. The list
 * view is used, since its rows are plain links; the card view is the cards' own concern.
 */
function project(title: string, overrides: Record<string, any> = {}) {
  return {
    title,
    url: `/sites/${title.toLowerCase()}`,
    hasUserAccess: true,
    isUserMember: false,
    phase: 'Gjennomføring',
    data: {},
    primaryUser: { name: 'Kari Nordmann' },
    secondaryUser: { name: 'Ola Nordmann' },
    ...overrides
  }
}

const spfxContext = {
  pageContext: {
    web: { absoluteUrl: 'https://contoso.sharepoint.com/sites/hub', id: 'web' },
    site: { id: 'site' },
    user: { email: 'kari@contoso.no' },
    legacyPageContext: { isSiteAdmin: false }
  }
} as any

function renderList(state: Record<string, any>) {
  fetched.state = { isDataLoaded: true, isUserInPortfolioManagerGroup: false, ...state }
  render(<ProjectList dataAdapter={{} as any} spfxContext={spfxContext} defaultRenderMode='list' />)
}

const projects = () => [
  project('Alfa', { isUserMember: true }),
  project('Bravo'),
  project('Charlie', { hasUserAccess: false })
]
const linkNames = () => screen.getAllByRole('link').map((link) => link.textContent)
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('ProjectList', () => {
  it("shows a tab per vertical the user may see, and the default vertical's projects", async () => {
    renderList({ projects: projects() })
    expect(await screen.findByRole('link', { name: 'Alfa' })).toBeInTheDocument()
    for (const name of [
      strings.ProjectsAccessHeaderText,
      strings.MyProjectsHeaderText,
      strings.ParentProjectsHeaderText,
      strings.ProgramsHeaderText
    ]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    // "All projects" is for portfolio managers only.
    expect(screen.queryByRole('tab', { name: strings.AllProjectsHeaderText })).toBeNull()
    expect(linkNames()).toEqual(['Alfa'])
  })

  it('switches vertical on a tab click', async () => {
    const user = setupUser()
    renderList({ projects: projects() })
    await screen.findByRole('link', { name: 'Alfa' })
    await user.click(screen.getByRole('tab', { name: strings.ProjectsAccessHeaderText }))
    expect(linkNames()).toEqual(['Alfa', 'Bravo'])
    expect(screen.queryByText('Charlie')).toBeNull()
  })

  it('shows every project, linked or not, to a portfolio manager in the all-projects vertical', async () => {
    const user = setupUser()
    renderList({ projects: projects(), isUserInPortfolioManagerGroup: true })
    await screen.findByRole('link', { name: 'Alfa' })
    await user.click(screen.getByRole('tab', { name: strings.AllProjectsHeaderText }))
    expect(linkNames()).toEqual(['Alfa', 'Bravo'])
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('searches the shown vertical', async () => {
    const user = setupUser()
    renderList({ projects: projects() })
    await screen.findByRole('link', { name: 'Alfa' })
    await user.click(screen.getByRole('tab', { name: strings.ProjectsAccessHeaderText }))
    await user.type(screen.getByRole('searchbox'), 'brav')
    expect(linkNames()).toEqual(['Bravo'])
  })

  it('tells when no projects came back', async () => {
    renderList({ projects: [] })
    expect(await screen.findByText(strings.NoProjectsFoundTitle)).toBeInTheDocument()
  })

  it('shows the error when the fetch failed', async () => {
    // A failed fetch leaves no projects; the error is what the user needs to see, not the empty list.
    renderList({ projects: [], error: 'Kilden svarte ikke' })
    expect(await screen.findByText(strings.ErrorFetchingProjectsTitle)).toBeInTheDocument()
    expect(screen.getByText('Kilden svarte ikke')).toBeInTheDocument()
    expect(screen.queryByText(strings.NoProjectsFoundTitle)).toBeNull()
  })
})
