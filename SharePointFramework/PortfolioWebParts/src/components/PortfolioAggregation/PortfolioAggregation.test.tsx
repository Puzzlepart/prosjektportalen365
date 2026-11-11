// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch dispatches what `fetched` holds.
const fetched: { action: () => any } = { action: () => null }
jest.mock('./usePortfolioAggregationDataFetch', () => ({
  usePortfolioAggregationDataFetch: (context: any) => {
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
import { DataSource, ProjectContentColumn, format } from 'pp365-shared-library'
import * as React from 'react'
import { PortfolioAggregation } from './PortfolioAggregation'
import { DATA_FETCHED, DATA_FETCH_ERROR } from './reducer'

/**
 * The aggregated overview web part as a whole: the list with the data source's columns and the
 * fetched rows, the search box named after the data source, and the error when the fetch fails.
 */
const contentColumn = (Id: number, Title: string, GtManagedProperty: string, GtSortOrder: number) =>
  new ProjectContentColumn({
    Id,
    Title,
    GtInternalName: GtManagedProperty,
    GtManagedProperty,
    GtFieldDataType: 'text',
    GtColMinWidth: 100,
    GtSortOrder
  } as any)
const columns = [
  contentColumn(1, 'Tittel', 'Title', 10),
  contentColumn(2, 'Leveransestatus', 'GtDeliveryStatusOWSCHCS', 20)
]
const dataSource = new DataSource(
  {
    Id: 1,
    Title: 'Alle leveranser',
    GtDataSourceLevel: ['Prosjekt'],
    GtProjectContentColumnsId: [1, 2],
    GtSearchQuery: '*',
    GtDataSourceCategory: 'Leveranser'
  } as any,
  columns
)

const spfxContext = {
  pageContext: {
    web: { absoluteUrl: 'https://contoso.sharepoint.com/sites/hub', id: 'web' },
    site: { id: 'site' },
    user: { email: 'kari@contoso.no' },
    legacyPageContext: { isSiteAdmin: false }
  }
} as any

function renderAggregation(action: () => any) {
  fetched.action = action
  render(
    <PortfolioAggregation
      title='Leveranseoversikt'
      dataAdapter={{} as any}
      spfxContext={spfxContext}
      pageContext={spfxContext.pageContext}
      dataSource='Alle leveranser'
      dataSourceCategory='Leveranser'
      configuration={{ views: [dataSource], columns, refiners: [], level: 'Prosjekt' } as any}
    />
  )
}

describe('PortfolioAggregation', () => {
  it("shows the fetched rows in the data source's columns, with the search box named after it", async () => {
    renderAggregation(() =>
      DATA_FETCHED({
        items: [
          {
            Title: 'Design av bane',
            GtDeliveryStatusOWSCHCS: 'Ihht. plan',
            SiteTitle: 'Alfa',
            SiteId: 's1'
          }
        ],
        columns,
        dataSource
      })
    )
    expect(await screen.findByText('Design av bane')).toBeInTheDocument()
    expect(screen.getByText('Ihht. plan')).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('columnheader')
        .map((h) => h.textContent?.trim())
        .filter(Boolean)
    ).toEqual(['Tittel', 'Leveransestatus', strings.ToggleColumnFormPanelLabel])
    expect(screen.getByText('Leveranseoversikt', { selector: 'span' })).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(format(strings.SearchBoxPlaceholderText, 'alle leveranser'))
    ).toBeInTheDocument()
  })

  it('shows the error when the fetch fails', async () => {
    renderAggregation(() => DATA_FETCH_ERROR({ error: new Error('Kilden svarte ikke') }))
    expect(await screen.findByText(strings.ErrorTitle)).toBeInTheDocument()
    expect(screen.getByText(/Kilden svarte ikke/)).toBeInTheDocument()
  })
})
