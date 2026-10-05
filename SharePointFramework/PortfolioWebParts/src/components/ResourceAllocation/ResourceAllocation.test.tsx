// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch is replaced by what `fetched` holds, and the
// shared timeline (the shared library's own concern) by a stand-in that reports what it was given.
const fetched: { data: { items: any[]; groups: any[] } } = { data: { items: [], groups: [] } }
jest.mock('./useResourceAllocationDataFetch', () => ({
  useResourceAllocationDataFetch: (_props: any, callback: (data: any) => void) => {
    const { useEffect } = jest.requireActual('react')
    useEffect(() => {
      callback(fetched.data)
    }, [])
  }
}))
jest.mock('pp365-shared-library', () => {
  const actual = jest.requireActual('pp365-shared-library')
  const React = jest.requireActual('react')
  return {
    ...actual,
    Timeline: (props: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'timeline' },
        React.createElement('h2', null, props.title),
        `${props.groups.length} grupper, ${props.items.length} elementer, ${props.filters.length} filtre`
      )
  }
})

import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { ResourceAllocation } from './index'

/**
 * The resource allocation web part: a loading state until the data is there, then the shared
 * timeline with the fetched groups and items and a filter per role, department, resource and
 * project.
 */
const allocation = (resource: string, role: string, group: number) => ({
  id: `${resource}-${role}`,
  group,
  title: resource,
  data: { role, department: 'Utvikling', resource, project: 'Alfa' },
  props: {
    GtResourceUserOWSUSER: `${resource.toLowerCase().replace(' ', '.')}@contoso.no | ${resource}`
  }
})

function renderAllocation() {
  render(
    <ResourceAllocation
      title='Ressursallokering'
      dataSource='Alle ressursallokeringer'
      dataAdapter={{} as any}
      spfxContext={
        { pageContext: { web: { absoluteUrl: 'https://contoso.sharepoint.com/sites/hub' } } } as any
      }
    />
  )
}

describe('ResourceAllocation', () => {
  it('shows the timeline with the fetched groups and items, and a filter per dimension', async () => {
    fetched.data = {
      groups: [
        { id: 1, title: 'Kari Nordmann' },
        { id: 2, title: 'Ola Nordmann' }
      ],
      items: [
        allocation('Kari Nordmann', 'Prosjektleder', 1),
        allocation('Ola Nordmann', 'Utvikler', 2),
        allocation('Kari Nordmann', 'Arkitekt', 1)
      ]
    }
    renderAllocation()
    expect(await screen.findByTestId('timeline')).toHaveTextContent(
      '2 grupper, 3 elementer, 4 filtre'
    )
    expect(screen.getByRole('heading', { name: 'Ressursallokering' })).toBeInTheDocument()
  })

  it('shows an empty timeline when nothing is allocated', async () => {
    fetched.data = { groups: [], items: [] }
    renderAllocation()
    expect(await screen.findByTestId('timeline')).toHaveTextContent('0 grupper, 0 elementer')
  })
})
