// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch hands back what `fetched.state` holds; the
// shared timeline (the shared library's own concern) is a stand-in that reports what it was
// given, as is the list below it, and the data adapter.
const fetched: { state: Record<string, any> | undefined } = { state: undefined }
jest.mock('./data/useProjectTimelineDataFetch', () => ({
  useProjectTimelineDataFetch: (_props: any, _refetch: number, callback: (s: any) => void) => {
    const { useEffect } = jest.requireActual('react')
    useEffect(() => {
      if (fetched.state) callback(fetched.state)
    }, [])
  }
}))
jest.mock('pp365-shared-library/lib/components', () => {
  const actual = jest.requireActual('pp365-shared-library/lib/components')
  const React = jest.requireActual('react')
  return {
    ...actual,
    Timeline: (props: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'timeline' },
        `${props.title}: ${props.groups.length} grupper, ${props.items.length} elementer`
      )
  }
})
jest.mock('./TimelineList/TimelineList', () => ({
  TimelineList: () => {
    const React = jest.requireActual('react')
    return React.createElement('div', null, 'tidslinjeliste')
  }
}))
jest.mock('../../data', () => ({ __esModule: true, default: { portalDataService: undefined } }))

import { render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { ProjectTimeline } from './ProjectTimeline'

/**
 * The project timeline web part: the spinner while loading, the error, and the timeline and the
 * list below it, each shown or hidden by the web part's properties.
 */
const loaded = {
  isDataLoaded: true,
  data: { items: [{ id: 1 }, { id: 2 }], groups: [{ id: 0, title: 'Alfa' }] },
  groups: { projectGroups: [], categoryGroups: [], typeGroups: [] },
  filters: [],
  timelineConfig: []
}

function renderTimeline(state: Record<string, any> | undefined, props: Record<string, any> = {}) {
  fetched.state = state
  render(<ProjectTimeline title='Prosjekttidslinje' {...props} />)
}

describe('ProjectTimeline', () => {
  it('shows the spinner until the data is there', () => {
    renderTimeline(undefined)
    expect(screen.getByText(format(strings.LoadingText, 'Prosjekttidslinje'))).toBeInTheDocument()
  })

  it('shows the timeline with the filtered data and the list below it', async () => {
    renderTimeline(loaded)
    expect(await screen.findByTestId('timeline')).toHaveTextContent(
      'Prosjekttidslinje: 1 grupper, 2 elementer'
    )
    expect(screen.getByText('tidslinjeliste')).toBeInTheDocument()
  })

  it('leaves out the timeline or the list when the web part says so', async () => {
    renderTimeline(loaded, { showTimeline: false })
    expect(await screen.findByText('tidslinjeliste')).toBeInTheDocument()
    expect(screen.queryByTestId('timeline')).toBeNull()
  })

  it('shows the error when the data cannot be fetched', async () => {
    renderTimeline({ isDataLoaded: true, error: { message: 'Kilden svarte ikke' } })
    expect(await screen.findByText(strings.ErrorTitle)).toBeInTheDocument()
    expect(screen.getByText('Kilden svarte ikke')).toBeInTheDocument()
  })
})
