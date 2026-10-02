import { render } from '@testing-library/react'
import * as React from 'react'
import { DynamicListContext } from './context'
import { useFilteredData } from './useFilteredData'

/**
 * The rows a dynamic list shows: narrowed by the search term across the columns and by the
 * active filters, every filter having to match.
 */
const listColumns = [
  { key: 'Title', fieldName: 'Title', name: 'Tittel', minWidth: 100 },
  { key: 'Status', fieldName: 'Status', name: 'Status', minWidth: 100 }
]
const listItems = [
  { Title: 'Design av bane', Status: 'Pågår' },
  { Title: 'Åpning', Status: 'Ferdig' },
  { Title: 'Baneplan', Status: 'Ferdig' }
]

function filtered(state: Record<string, any>) {
  const captured: { items: any[] } = { items: [] }
  const Probe: React.FC = () => {
    captured.items = useFilteredData()
    return null
  }
  render(
    <DynamicListContext.Provider
      value={
        {
          state: { data: { listItems, listColumns }, activeFilters: {}, searchTerm: '', ...state }
        } as any
      }
    >
      <Probe />
    </DynamicListContext.Provider>
  )
  return captured.items.map((i) => i.Title)
}

describe('useFilteredData', () => {
  it('shows every row without a search or filters', () => {
    expect(filtered({})).toEqual(['Design av bane', 'Åpning', 'Baneplan'])
  })

  it('searches every column, case-insensitively', () => {
    expect(filtered({ searchTerm: 'BANE' })).toEqual(['Design av bane', 'Baneplan'])
    expect(filtered({ searchTerm: 'ferdig' })).toEqual(['Åpning', 'Baneplan'])
  })

  it('applies the active filters, every one of them', () => {
    expect(filtered({ activeFilters: { Status: ['Ferdig'] } })).toEqual(['Åpning', 'Baneplan'])
    expect(filtered({ activeFilters: { Status: ['Ferdig'], Title: ['Åpning'] } })).toEqual([
      'Åpning'
    ])
    expect(filtered({ activeFilters: { Status: [] } })).toHaveLength(3)
  })

  it('combines the search and the filters', () => {
    expect(filtered({ searchTerm: 'bane', activeFilters: { Status: ['Ferdig'] } })).toEqual([
      'Baneplan'
    ])
  })

  it('gives nothing before the data is there', () => {
    expect(filtered({ data: undefined })).toEqual([])
  })
})
