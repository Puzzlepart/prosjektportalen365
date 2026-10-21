// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch is replaced by what `fetched` holds, and the
// ideas overview (the aggregation web part, tested on its own) by a stand-in naming its view.
const fetched: { state: Record<string, any> } = { state: {} }
jest.mock('./useIdeaModuleDataFetch', () => ({
  useIdeaModuleDataFetch: (_props: any, _refetch: number, setState: (state: any) => void) => {
    const { useEffect } = jest.requireActual('react')
    useEffect(() => {
      setState(fetched.state)
    }, [])
  }
}))
jest.mock('components', () => {
  const React = jest.requireActual('react')
  return {
    PortfolioAggregation: (props: any) =>
      React.createElement('div', null, `Idéoversikt: ${props.title}`)
  }
})

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { IdeaModule } from './IdeaModule'

/**
 * The idea module web part: a loading state, then the navigation with the registered ideas and
 * the ideas in processing, the overview of the configured view, and the error when no view exists.
 */
const configuration = {
  title: 'Standard',
  registration: [{ key: 'approve', choice: 'Godkjent', recommendation: 'Anbefalt' }],
  processing: [{ key: 'approve', choice: 'Godkjent', recommendation: 'Godkjent' }]
}

const ideas = {
  data: {
    items: [
      { Id: 1, Title: 'Sykkelparkering' },
      {
        Id: 2,
        Title: 'Solceller på taket',
        processing: { Id: 7, GtIdeaDecision: 'Under vurdering' }
      }
    ],
    fields: { registered: [], processing: [] },
    fieldValues: { registered: [], processing: [] },
    columns: []
  }
}

function renderModule(views: any[] = [{ id: 1, title: 'Alle idéer' }]) {
  fetched.state = { loading: false, configuration, ideas, isRefetching: false }
  render(
    <IdeaModule
      title='Idémodul'
      ideaConfigurationList='Idékonfigurasjon'
      ideaConfiguration='Standard'
      dataAdapter={{} as any}
      configuration={{ views, columns: [], refiners: [] } as any}
      spfxContext={
        { pageContext: { web: { absoluteUrl: 'https://contoso.sharepoint.com/sites/hub' } } } as any
      }
    />
  )
}

describe('IdeaModule', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('lists the ideas in the navigation and opens the overview of the first view', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderModule()
    expect(await screen.findByText('Idéoversikt: Alle idéer')).toBeInTheDocument()
    expect(screen.getByText('Sykkelparkering')).toBeInTheDocument()
    // The ideas in processing sit in a collapsed category until it is opened.
    await user.click(screen.getByText(strings.Idea.ProcessingIdeasTitle))
    expect(await screen.findByText('Solceller på taket')).toBeInTheDocument()
    expect(window.location.hash).toBe('#viewId=1')
  })

  it('names the menu button, says whether the menu is open, and keeps the focus on the button that takes its place (WCAG 4.1.2, 2.4.3)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderModule()
    await screen.findByText('Idéoversikt: Alle idéer')
    const name = strings.Idea.NavigationMenuLabel
    const inMenu = screen.getByRole('button', { name })
    expect(inMenu).toHaveAttribute('aria-expanded', 'true')
    await user.click(inMenu)
    // The menu's button goes with the menu, and the one beside the content takes the focus.
    const beside = document.querySelector<HTMLElement>('.hamburger button')
    expect(beside).toHaveAccessibleName(name)
    expect(beside).toHaveAttribute('aria-expanded', 'false')
    expect(beside).toHaveFocus()
    await user.click(beside)
    expect(document.activeElement).toHaveAccessibleName(name)
    expect(document.activeElement).toHaveAttribute('aria-expanded', 'true')
  })

  describe('on a narrow screen', () => {
    const matchMedia = window.matchMedia
    beforeEach(() => {
      window.matchMedia = (query: string) =>
        ({ ...matchMedia(query), matches: query === '(max-width: 480px)' }) as MediaQueryList
    })
    afterEach(() => {
      window.matchMedia = matchMedia
    })

    it('starts with the menu closed, where it took the whole width and left the ideas none (WCAG 1.4.10)', async () => {
      renderModule()
      expect(await screen.findByText('Idéoversikt: Alle idéer')).toBeInTheDocument()
      const beside = document.querySelector<HTMLElement>('.hamburger button')
      expect(beside).toHaveAccessibleName(strings.Idea.NavigationMenuLabel)
      expect(beside).toHaveAttribute('aria-expanded', 'false')
    })

    it('closes the menu once an idea is chosen, and gives the focus to the button beside it', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      renderModule()
      await screen.findByText('Idéoversikt: Alle idéer')
      await user.click(document.querySelector<HTMLElement>('.hamburger button'))
      await user.click(screen.getByText('Sykkelparkering'))
      expect(
        await screen.findByRole('heading', { level: 2, name: 'Sykkelparkering' })
      ).toBeInTheDocument()
      const beside = document.querySelector<HTMLElement>('.hamburger button')
      expect(beside).toHaveAttribute('aria-expanded', 'false')
      expect(beside).toHaveFocus()
    })
  })

  it('opens an idea under a heading below the page title, its phases a list marking the current, and its status under its own heading (WCAG 1.3.1)', async () => {
    window.location.hash = '#ideaId=1'
    renderModule()
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Sykkelparkering' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: strings.Idea.StatusTitle })
    ).toBeInTheDocument()
    // The phases were tabs that did nothing, the others disabled and the arrows between them
    // nameless tabs.
    expect(screen.queryByRole('tab')).toBeNull()
    const steps = within(screen.getByRole('list', { name: strings.Idea.PhasesLabel })).getAllByRole(
      'listitem'
    )
    expect(steps.map((step) => step.textContent)).toEqual([
      strings.Idea.RegistrationPhaseTitle,
      strings.Idea.ProcessingPhaseTitle,
      strings.Idea.ApprovedPhaseTitle,
      strings.Idea.ProvisionAreaTitle
    ])
    expect(steps[0]).toHaveAttribute('aria-current', 'step')
    expect(steps[1]).not.toHaveAttribute('aria-current')
  })

  it('tells when there is no view to open', async () => {
    renderModule([])
    expect(await screen.findByText(strings.NoViewFoundTitle)).toBeInTheDocument()
  })
})
