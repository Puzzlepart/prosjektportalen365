import { renderHook } from '@testing-library/react'
import { usePortfolioAggregationFilteredItems } from './usePortfolioAggregationFilteredItems'

/**
 * The rows the aggregation list shows. The search matches the columns the list shows, so showing
 * or hiding a column while a search is active changes the rows, as it changes what
 * `Eksporter til Excel` writes (`getFilteredItems`).
 */
describe('usePortfolioAggregationFilteredItems', () => {
  const title = { key: 'Title', fieldName: 'Title', name: 'Tittel' }
  const comment = { key: 'GtComment', fieldName: 'GtComment', name: 'Kommentar' }
  const state = {
    items: [
      { Title: 'Gevinst A', GtComment: 'Forsinket leveranse', SiteTitle: 'Prosjekt 1' },
      { Title: 'Gevinst B', GtComment: 'I rute', SiteTitle: 'Prosjekt 2' }
    ],
    searchTerm: 'forsinket',
    activeFilters: {},
    filters: []
  }

  it('searches the columns shown now, after a column is shown or hidden', () => {
    const { result, rerender } = renderHook(
      ({ columns }) =>
        usePortfolioAggregationFilteredItems({ state: { ...state, columns } } as any),
      { initialProps: { columns: [title] } }
    )
    expect(result.current).toEqual([])

    rerender({ columns: [title, comment] })
    expect(result.current.map((item) => item.Title)).toEqual(['Gevinst A'])

    rerender({ columns: [title] })
    expect(result.current).toEqual([])
  })
})
