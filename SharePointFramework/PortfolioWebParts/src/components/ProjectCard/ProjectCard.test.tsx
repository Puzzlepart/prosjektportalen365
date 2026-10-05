// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted.
jest.mock('pp365-projectwebparts/lib/components/ProjectInformationPanel', () => ({
  ProjectInformationPanel: () => null
}))

import { render, screen } from '@testing-library/react'
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

describe('ProjectCard', () => {
  it('fetches the project and shows its card', async () => {
    const dataAdapter = {
      fetchEnrichedProject: jest.fn().mockResolvedValue({
        title: 'Alfa',
        url: '/sites/alfa',
        hasUserAccess: true,
        phase: 'Konsept',
        data: {},
        primaryUser: { name: 'Kari Nordmann' },
        secondaryUser: { name: 'Ola Nordmann' },
        template: 'Standard'
      })
    }
    render(
      <ProjectCard
        dataAdapter={dataAdapter as any}
        projectSiteId='site-1'
        spfxContext={spfxContext}
      />
    )
    // The title text only shows once a custom image has loaded; the phase badge and the people
    // are what prove the card is there.
    expect(await screen.findByTitle('Konsept')).toBeInTheDocument()
    expect(dataAdapter.fetchEnrichedProject).toHaveBeenCalledWith('site-1', undefined)
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/sites/alfa')
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
