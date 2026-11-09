// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted.
jest.mock('pp365-projectwebparts/lib/components/ProjectInformationPanel', () => ({
  ProjectInformationPanel: () => null
}))

import { render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { ProjectCard } from './ProjectCard'

/**
 * The single project card web part: fetches the one project through the adapter and shows its
 * card with title, phase and people.
 */
const spfxContext = {
  pageContext: {
    web: { absoluteUrl: 'https://contoso.sharepoint.com/sites/hub', id: 'web' },
    site: { id: 'site' },
    user: { email: 'kari@contoso.no' },
    legacyPageContext: { isSiteAdmin: false }
  }
} as any

const PROJECT = {
  title: 'Alfa',
  url: '/sites/alfa',
  hasUserAccess: true,
  phase: 'Konsept',
  data: {},
  primaryUser: { name: 'Kari Nordmann' },
  secondaryUser: { name: 'Ola Nordmann' },
  template: 'Standard'
}

describe('ProjectCard', () => {
  it('fetches the project and shows its card', async () => {
    const dataAdapter = { fetchEnrichedProject: jest.fn().mockResolvedValue(PROJECT) }
    render(
      <ProjectCard
        dataAdapter={dataAdapter as any}
        projectSiteId='site-1'
        spfxContext={spfxContext}
      />
    )
    // The title text only shows once a custom image has loaded; the phase badge and the people
    // are what prove the card is there.
    expect(
      await screen.findByRole('img', {
        name: format(strings.NameValueLabel, strings.PhaseLabel, 'Konsept')
      })
    ).toBeInTheDocument()
    expect(dataAdapter.fetchEnrichedProject).toHaveBeenCalledWith('site-1', undefined)
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/sites/alfa')
  })

  it('says it is loading while the project is fetched (WCAG 4.1.2)', () => {
    // It showed nothing until the project came.
    const dataAdapter = { fetchEnrichedProject: jest.fn(() => new Promise(() => undefined)) }
    render(
      <ProjectCard
        dataAdapter={dataAdapter as any}
        projectSiteId='site-1'
        spfxContext={spfxContext}
      />
    )
    // The library's skeleton, named by its strings, which have no typings here.
    expect(screen.getByRole('progressbar', { name: 'Laster...' })).toBeInTheDocument()
  })

  it('says so when the project cannot be fetched (WCAG 3.3.1, 4.1.3)', async () => {
    // The failure was not caught, and the web part stayed empty.
    const dataAdapter = {
      fetchEnrichedProject: jest.fn().mockRejectedValue(new Error('Tilgang nektet'))
    }
    render(
      <ProjectCard
        dataAdapter={dataAdapter as any}
        projectSiteId='site-1'
        spfxContext={spfxContext}
      />
    )
    expect(await screen.findByText(strings.ProjectCard.LoadErrorText)).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('marks the button that opens the project information as where the panel gives the focus back (WCAG 2.4.3)', async () => {
    const dataAdapter = { fetchEnrichedProject: jest.fn().mockResolvedValue(PROJECT) }
    render(
      <ProjectCard
        dataAdapter={dataAdapter as any}
        projectSiteId='site-1'
        spfxContext={spfxContext}
      />
    )
    // Fluent's drawer gives the focus back only to an element marked as its restore target.
    const open = await screen.findByRole('button', { name: strings.ProjectInformationPanelButton })
    expect(open.getAttribute('data-tabster')).toContain('"restorer"')
  })

  it('shows nothing of the card until the project is there', () => {
    const dataAdapter = { fetchEnrichedProject: jest.fn(() => new Promise(() => undefined)) }
    render(
      <ProjectCard
        dataAdapter={dataAdapter as any}
        projectSiteId='site-1'
        spfxContext={spfxContext}
      />
    )
    expect(screen.queryByRole('link')).toBeNull()
  })
})
