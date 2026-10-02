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

import { render, screen } from '@testing-library/react'
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

  it('tells when there is no view to open', async () => {
    renderModule([])
    expect(await screen.findByText(strings.NoViewFoundTitle)).toBeInTheDocument()
  })
})
