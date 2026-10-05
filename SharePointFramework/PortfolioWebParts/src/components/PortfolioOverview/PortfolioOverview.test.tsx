// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch dispatches what `fetched` holds; the project
// information panel of ProjectWebParts is not under test and only passes its trigger through.
const fetched: { action: () => any } = { action: () => null }
jest.mock('./hooks/useFetchData', () => ({
  useFetchData: (context: any) => {
    const { useEffect } = jest.requireActual('react')
    useEffect(() => {
      context.dispatch(fetched.action())
    }, [])
  }
}))
jest.mock('pp365-projectwebparts/lib/components/ProjectInformationPanel', () => ({
  ProjectInformationPanel: ({ children }: any) => children ?? null
}))
jest.mock('pp365-projectwebparts/lib/components/ProjectInformation', () => ({
  ProjectInformationPanel: ({ children }: any) => children ?? null
}))

import { render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectColumn, format } from 'pp365-shared-library'
import * as React from 'react'
import { PortfolioOverview } from './PortfolioOverview'
import { DATA_FETCHED, DATA_FETCH_ERROR } from './reducer'

/**
 * The portfolio overview web part as a whole: the list with the view's columns and the fetched
 * rows, the toolbar with the view selector, export and filters, the search box named after the
 * view, and the error when the fetch fails.
 */
// The configuration's columns are ProjectColumn instances: the show/hide panel calls setData on them.
const column = (id: number, fieldName: string, name: string) =>
  Object.assign(
    new ProjectColumn({
      Id: id,
      Title: name,
      GtInternalName: fieldName,
      GtManagedProperty: fieldName,
      GtFieldDataType: 'text',
      GtColMinWidth: 100,
      GtSortOrder: id * 10
    } as any),
    { key: fieldName, fieldName, name, dataType: 'text' }
  )
const columns = [column(1, 'Title', 'Tittel'), column(2, 'GtProjectPhase', 'Fase')]
const view = {
  id: 1,
  title: 'Alle prosjekter',
  columns,
  columnOrder: [],
  author: 'ola@contoso.no',
  isPersonal: false
} as any

const spfxContext = {
  pageContext: {
    web: { absoluteUrl: 'https://contoso.sharepoint.com/sites/hub', id: 'web' },
    site: { id: 'site' },
    user: { email: 'kari@contoso.no' },
    legacyPageContext: { isSiteAdmin: false }
  }
} as any

function renderOverview(action: () => any) {
  fetched.action = action
  render(
    <PortfolioOverview
      title='Porteføljeoversikt'
      dataAdapter={{} as any}
      spfxContext={spfxContext}
      pageContext={spfxContext.pageContext}
      configuration={
        { views: [view], columns, refiners: [], userCanAddViews: false, hubSiteId: 'hub' } as any
      }
    />
  )
}

describe('PortfolioOverview', () => {
  it("shows the fetched projects in the view's columns, with the toolbar and the search box", async () => {
    renderOverview(() =>
      DATA_FETCHED({
        items: [{ Title: 'Alfa', Path: '/sites/alfa', GtProjectPhase: 'Konsept', SiteId: 's1' }],
        currentView: view,
        groupBy: null,
        managedProperties: [],
        isUserInPortfolioManagerGroup: false,
        showChildProjectInfoInProgram: false
      })
    )
    expect(await screen.findByRole('link', { name: 'Alfa' })).toHaveAttribute('href', '/sites/alfa')
    expect(screen.getByText('Konsept')).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('columnheader')
        .map((h) => h.textContent?.trim())
        .filter(Boolean)
    ).toEqual(['Tittel', 'Fase', strings.ToggleColumnFormPanelLabel])
    expect(screen.getByText('Porteføljeoversikt', { selector: 'span' })).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(format(strings.SearchBoxPlaceholderText, 'Alle prosjekter'))
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alle prosjekter' })).toBeInTheDocument()
    expect(screen.getByTitle(strings.ExcelExportButtonLabel)).toBeInTheDocument()
    expect(screen.getByTitle(strings.FilterText)).toBeInTheDocument()
  })

  it('shows the error when the fetch fails', async () => {
    renderOverview(() => DATA_FETCH_ERROR({ error: new Error('Kilden svarte ikke'), view }))
    expect(await screen.findByText(strings.ErrorTitle)).toBeInTheDocument()
    expect(screen.getByText(/Kilden svarte ikke/)).toBeInTheDocument()
  })
})
