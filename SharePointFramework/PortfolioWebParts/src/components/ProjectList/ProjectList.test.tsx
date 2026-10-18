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
// The card view sizes itself to its container, which jsdom gives no width; it gets a row's.
jest.mock('react-virtualized-auto-sizer', () => ({
  __esModule: true,
  default: ({ children }: any) => children({ width: 968, height: 880 })
}))

import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
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

function renderList(
  state: Record<string, any>,
  defaultRenderMode: 'list' | 'tiles' = 'list',
  props: Record<string, any> = {}
) {
  fetched.state = { isDataLoaded: true, isUserInPortfolioManagerGroup: false, ...state }
  render(
    <AriaLiveAnnouncer>
      <ProjectList
        dataAdapter={{} as any}
        spfxContext={spfxContext}
        defaultRenderMode={defaultRenderMode}
        {...props}
      />
    </AriaLiveAnnouncer>
  )
}

/** As `renderList`, giving back the container to look into with selectors. */
function renderListIn(state: Record<string, any>) {
  renderList(state)
  return { container: document.body }
}

/** The people columns the cards name their roles by. */
const PROJECT_COLUMNS = [
  { internalName: 'GtProjectOwner', fieldName: 'gtprojectowner', name: 'Prosjekteier' },
  { internalName: 'GtProjectManager', fieldName: 'gtprojectmanager', name: 'Prosjektleder' }
]

/**
 * What the announcer's live region holds now. It writes each message as `innerText` on a span of
 * its own, which jsdom keeps as a property rather than as text, and clears the region through
 * `innerText` too, which jsdom ignores: the newest message is the last span.
 */
const announced = () =>
  Array.from(document.body.querySelectorAll('[aria-live]'))
    .map((region) => {
      const spans = region.querySelectorAll('span')
      const span = spans[spans.length - 1] as HTMLElement | undefined
      return (span && (span.innerText || span.textContent)) || region.textContent || ''
    })
    .join(' ')

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

  it('keeps its cards as the project information opens, so the button that opened it is there to take the focus back (WCAG 2.4.3)', async () => {
    renderList({ projects: projects() }, 'tiles')
    const [open] = await screen.findAllByRole('button', {
      name: strings.ProjectInformationPanelButton
    })
    fireEvent.click(open)
    // The rows were remade on every render of the list, so the button was a new one.
    expect(open.isConnected).toBe(true)
  })

  it("names a card's people by their role, its phase and its type, with no role of their own on the pictures (WCAG 1.1.1, 4.1.2)", async () => {
    renderList(
      {
        projects: [
          project('Alfa', {
            isUserMember: true,
            template: 'Standardmal',
            // The data adapter gives each person the field's internal name as `role`.
            primaryUser: { name: 'Kari Nordmann', role: 'GtProjectOwner' },
            secondaryUser: { name: 'Ola Nordmann', role: 'GtProjectManager' }
          })
        ]
      },
      'tiles',
      { projectColumns: PROJECT_COLUMNS }
    )
    expect(
      await screen.findByRole('img', {
        name: format(strings.NameValueLabel, 'Prosjekteier', 'Kari Nordmann')
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: format(strings.NameValueLabel, 'Prosjektleder', 'Ola Nordmann')
      })
    ).toBeInTheDocument()
    expect(
      document.querySelectorAll('[role="GtProjectOwner"], [role="GtProjectManager"]')
    ).toHaveLength(0)
    expect(
      screen.getByRole('img', {
        name: format(strings.NameValueLabel, strings.PhaseLabel, 'Gjennomføring')
      })
    ).toBeInTheDocument()
    // The type was a button that did nothing.
    expect(screen.getByRole('img', { name: /\(Standardmal\)$/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Standardmal' })).toBeNull()
  })

  it('names the panel button once, and the link to the project by the project (WCAG 2.4.4, 4.1.2)', async () => {
    renderList({ projects: projects() }, 'tiles')
    const button = await screen.findByRole('button', {
      name: strings.ProjectInformationPanelButton
    })
    expect(button).not.toHaveAttribute('title')
    expect(screen.getByRole('link', { name: 'Alfa' })).toHaveAttribute('href', '/sites/alfa')
  })

  // Selectors where the tree is large: `getByRole` computes it whole per call, and under a full
  // run's load this test took over five seconds by roles (see the testing guide).
  it('ties the projects to the tab of their selection, and names the view mode button by what it does (WCAG 1.3.1, 2.4.6)', async () => {
    const { container } = renderListIn({ projects: projects() })
    await screen.findByText('Alfa', { selector: 'a' })
    const selected = container.querySelector('[role="tab"][aria-selected="true"]')
    expect(container.querySelector('[role="tabpanel"]')).toHaveAttribute(
      'aria-labelledby',
      selected.id
    )
    const viewMode = Array.from(container.querySelectorAll('button[aria-label]')).find((button) =>
      button.getAttribute('aria-label').endsWith(format(strings.RenderModeButtonLabel, ''))
    )
    expect(viewMode).toBeTruthy()
  })

  it('tells how many of the selection a search shows (WCAG 4.1.3)', async () => {
    const user = setupUser()
    renderList({ projects: projects() })
    await screen.findByText('Alfa', { selector: 'a' })
    // A Fluent tab draws its text twice, the second to keep its width when selected.
    const tab = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]')).find((element) =>
      element.textContent.includes(strings.ProjectsAccessHeaderText)
    )
    await user.click(tab)
    await user.type(screen.getByPlaceholderText(/./), 'brav')
    await waitFor(
      () => expect(announced()).toContain(format(strings.ProjectsShownAnnouncement, 1, 2)),
      { timeout: 2000 }
    )
  }, 20000)

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
