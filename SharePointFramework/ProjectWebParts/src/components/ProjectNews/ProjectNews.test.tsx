// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch sets what `fetched.state` holds; the dialog that
// creates a page is its own concern.
const fetched: { state: Record<string, any> | undefined } = { state: undefined }
jest.mock('./useProjectNewsDataFetch', () => ({
  useProjectNewsDataFetch: (_props: any, _refetch: number, setState: (s: any) => void) => {
    const { useEffect } = jest.requireActual('react')
    useEffect(() => {
      if (fetched.state) setState({ loading: false, ...fetched.state })
    }, [])
  }
}))
jest.mock('./NewsDialog', () => ({ NewsDialog: () => null }))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { ProjectNews } from './ProjectNews'

/**
 * The project news web part: the title and the button that creates a page, the recent pages as
 * cards folded past the limit, and the loading, empty and error states.
 */
const news = (id: number, name: string) => ({
  id,
  promotedState: 1,
  name,
  url: `/sites/alfa/SitePages/Nyheter/${name}`,
  authorName: 'Kari Nordmann',
  modifiedDate: '2026-09-01T08:00:00Z'
})

function renderNews(state: Record<string, any> | undefined, props: Record<string, any> = {}) {
  fetched.state = state
  render(
    <ProjectNews
      title='Prosjektnyheter'
      siteUrl='https://contoso.sharepoint.com/sites/alfa'
      context={{ pageContext: { site: { id: 'site-1' } } } as any}
      spHttpClient={{} as any}
      maxVisibleNews={2}
      {...props}
    />
  )
}

describe('ProjectNews', () => {
  it('shows the title, the create button and the recent pages as cards, folded past the limit', async () => {
    const user = userEvent.setup()
    renderNews({
      data: { news: [news(1, 'Ny-bane.aspx'), news(2, 'Åpning.aspx'), news(3, 'Dugnad.aspx')] }
    })
    expect(await screen.findByRole('link', { name: 'Ny bane' })).toHaveAttribute(
      'href',
      '/sites/alfa/SitePages/Nyheter/Ny-bane.aspx'
    )
    expect(screen.getByText('Prosjektnyheter', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.CreateNewsLinkLabel })).toBeInTheDocument()
    expect(screen.getAllByText('Kari Nordmann')).toHaveLength(2)
    // In SharePoint's UI language (Norwegian when the page names none), not jsdom's en-US.
    const dates = screen.getAllByTitle(format(strings.ModifiedTooltipText, '01.09.2026'))
    expect(dates).toHaveLength(2)
    expect(dates[0]).toHaveTextContent('| 01.09.2026')
    expect(screen.queryByRole('link', { name: 'Dugnad' })).toBeNull()
    await user.click(screen.getByRole('button', { name: strings.ShowMoreNews }))
    expect(screen.getByRole('link', { name: 'Dugnad' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: strings.ShowLessNews }))
    expect(screen.queryByRole('link', { name: 'Dugnad' })).toBeNull()
  })

  it('tells when there are no pages yet', async () => {
    renderNews({ data: { news: [] } })
    expect(await screen.findByText(strings.NoRecentNews)).toBeInTheDocument()
  })

  it('shows the spinner while loading', () => {
    renderNews(undefined)
    expect(screen.getByText(format(strings.LoadingText, 'Prosjektnyheter'))).toBeInTheDocument()
  })

  it('shows the error when the pages cannot be fetched', async () => {
    renderNews({ error: new Error('Kilden svarte ikke') })
    expect(await screen.findByText('Kilden svarte ikke')).toBeInTheDocument()
  })
})
