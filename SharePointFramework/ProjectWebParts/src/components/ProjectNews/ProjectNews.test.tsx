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

import { useRestoreFocusTarget } from '@fluentui/react-components'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeComponent } from 'pp365-jest-config/lib/axe'
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

  it('lists the news, says whether more are shown, and keeps the separator from being read (WCAG 1.3.1, 4.1.2)', async () => {
    const user = userEvent.setup()
    renderNews({
      data: { news: [news(1, 'Ny-bane.aspx'), news(2, 'Åpning.aspx'), news(3, 'Dugnad.aspx')] }
    })
    const list = await screen.findByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    const more = screen.getByRole('button', { name: strings.ShowMoreNews })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await user.click(more)
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('button', { name: strings.ShowLessNews })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    const [date] = screen.getAllByTitle(format(strings.ModifiedTooltipText, '01.09.2026'))
    expect(date.querySelector('[aria-hidden="true"]')).toHaveTextContent('|')
    expect(await axeComponent(list)).toHaveNoViolations()
  })

  it('tells when there are no pages yet', async () => {
    renderNews({ data: { news: [] } })
    expect(await screen.findByText(strings.NoRecentNews)).toBeInTheDocument()
  })

  it('shows the spinner while loading', () => {
    renderNews(undefined)
    expect(screen.getByText(format(strings.LoadingText, 'Prosjektnyheter'))).toBeInTheDocument()
  })

  it('marks the create button as where the focus goes back to when the dialog closes (WCAG 2.4.3)', async () => {
    // The dialog opens from state, so Fluent has no trigger of its own to give the focus back to,
    // and it was left on the page's start.
    let target: ReturnType<typeof useRestoreFocusTarget>
    const Probe: React.FC = () => {
      target = useRestoreFocusTarget()
      return null
    }
    render(<Probe />)
    renderNews({ data: { news: [] } })
    const [attribute, value] = Object.entries(target)[0]
    expect(
      await screen.findByRole('button', { name: strings.CreateNewsLinkLabel })
    ).toHaveAttribute(attribute, value)
  })

  it('shows the error when the pages cannot be fetched', async () => {
    renderNews({ error: new Error('Kilden svarte ikke') })
    expect(await screen.findByText('Kilden svarte ikke')).toBeInTheDocument()
  })
})
