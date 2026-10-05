// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch sets what `fetched.state` holds; the permission
// check, the web lookup, the toolbar (which reaches SharePoint) and the data adapter are stand-ins.
const fetched: { state: Record<string, any> | undefined } = { state: undefined }
jest.mock('./data/useDynamicListDataFetch', () => ({
  useDynamicListDataFetch: (_props: any, _state: any, setState: (s: any) => void) => {
    const { useEffect } = jest.requireActual('react')
    useEffect(() => {
      if (fetched.state) setState({ isLoading: false, ...fetched.state })
    }, [])
  }
}))
jest.mock('./hooks/useListPermissions', () => ({
  useListPermissions: () => ({ canAdd: true, canEdit: true, canDelete: true, isLoading: false })
}))
jest.mock('./utils/webUtils', () => ({ getWeb: () => ({}) }))
jest.mock('./useToolbarItems', () => ({
  useToolbarItems: () => ({
    menuItems: [],
    farMenuItems: [],
    filterPanelProps: undefined,
    customActionDialog: null,
    toaster: null
  })
}))
jest.mock('../../data', () => ({ __esModule: true, default: { portalDataService: {}, sp: {} } }))

import { render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { DynamicList } from './DynamicList'
import { DynamicListMode } from './types'

/**
 * The dynamic list web part as a whole: the message without a list, the title from the list,
 * the rows under their columns, the empty list, the single-item view with its fields, and the
 * warnings and errors.
 */
const listColumns = [
  { key: 'Title', fieldName: 'Title', name: 'Tittel', minWidth: 100 },
  { key: 'Status', fieldName: 'Status', name: 'Status', minWidth: 100 }
]
const listItems = [
  { Id: 1, Title: 'Design av bane', Status: 'Pågår' },
  { Id: 2, Title: 'Åpning', Status: 'Ferdig' }
]

function renderList(state: Record<string, any> | undefined, props: Record<string, any> = {}) {
  fetched.state = state
  render(
    <DynamicList
      listName='Leveranser'
      mode={DynamicListMode.Multi}
      showCommandBar
      webAbsoluteUrl='https://contoso.sharepoint.com/sites/alfa'
      {...props}
    />
  )
}

describe('DynamicList', () => {
  it('asks for a list when none is configured', () => {
    renderList(undefined, { listName: undefined, title: 'Leveranser' })
    expect(screen.getByText(strings.DynamicList.NoListSelected)).toBeInTheDocument()
  })

  it('shows the rows under their columns, titled after the list', async () => {
    renderList({ data: { listItems, listColumns, listTitle: 'Leveranser' } })
    expect(await screen.findByText('Design av bane')).toBeInTheDocument()
    expect(screen.getByText('Leveranser', { selector: 'span' })).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('columnheader')
        .map((h) => h.textContent?.trim())
        .filter(Boolean)
    ).toEqual(['Tittel', 'Status'])
    expect(screen.getByText('Ferdig')).toBeInTheDocument()
  })

  it('tells when the list has no rows', async () => {
    renderList({ data: { listItems: [], listColumns, listTitle: 'Leveranser' } })
    expect(await screen.findByText(strings.DynamicList.NoItemsToShow)).toBeInTheDocument()
  })

  it('shows one item with its fields in single mode', async () => {
    renderList(
      { data: { listItems, listColumns, listTitle: 'Leveranser' } },
      { mode: DynamicListMode.Single }
    )
    expect(await screen.findByRole('heading', { name: 'Design av bane' })).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Pågår')).toBeInTheDocument()
    expect(screen.queryByText('Åpning')).toBeNull()
  })

  it('warns when the site id fields are missing, and shows a fetch error', async () => {
    renderList({
      data: { listItems, listColumns, listTitle: 'Leveranser', siteIdFieldMissing: true }
    })
    expect(await screen.findByText(strings.DynamicList.SiteIdFieldsMissing)).toBeInTheDocument()
  })

  it('shows the error of a failed fetch', async () => {
    renderList({ error: 'Kilden svarte ikke', data: undefined })
    expect(await screen.findByText(/Kilden svarte ikke/)).toBeInTheDocument()
  })
})
