import { searchAggregatedItems } from './searchAggregatedItems'

/**
 * A search stand-in: answers each query with the rows whose page it asks for, `rowLimit` at a
 * time, out of `total` rows, and records the queries.
 */
function searchFor(total: number) {
  const queries: any[] = []
  const sp: any = {
    search: (query: any) => {
      queries.push(query)
      const start = query.StartRow
      const rows = Array.from(
        { length: Math.max(0, Math.min(query.RowLimit, total - start)) },
        (_, i) => ({
          Title: `Element ${start + i + 1}`,
          query: query.QueryTemplate
        })
      )
      return Promise.resolve({ PrimarySearchResults: rows, TotalRows: total })
    }
  }
  return { sp, queries }
}

describe('searchAggregatedItems', () => {
  it('finds nothing for no sites', async () => {
    const { sp, queries } = searchFor(10)
    expect(
      await searchAggregatedItems(sp, { siteIds: [], queryTemplate: 'ContentType:Risiko' })
    ).toEqual([])
    expect(queries).toEqual([])
  })

  it('searches the sites with the query, asking for the properties it needs', async () => {
    const { sp, queries } = searchFor(2)
    const items = await searchAggregatedItems(sp, {
      siteIds: ['site-1', 'site-2'],
      queryTemplate: 'ContentType:Risiko',
      selectProperties: ['GtRiskProbability']
    })
    expect(items.map(({ Title }) => Title)).toEqual(['Element 1', 'Element 2'])
    expect(queries[0]).toMatchObject({
      Querytext: '*',
      RowLimit: 500,
      StartRow: 0,
      TrimDuplicates: false,
      SelectProperties: ['GtRiskProbability', 'Path', 'Title', 'SiteTitle', 'SPWebURL']
    })
    expect(queries[0].QueryTemplate).toContain('site-1')
    expect(queries[0].QueryTemplate).toContain('site-2')
    expect(queries[0].QueryTemplate).toContain('ContentType:Risiko')
  })

  it('pages through every row the search has', async () => {
    const { sp, queries } = searchFor(5)
    const items = await searchAggregatedItems(sp, {
      siteIds: ['site-1'],
      queryTemplate: 'ContentType:Risiko',
      rowLimit: 2
    })
    expect(items).toHaveLength(5)
    expect(queries.map(({ StartRow }) => StartRow)).toEqual([0, 2, 4])
  })

  it('includes the site itself first when asked to, under its own property', async () => {
    const { sp, queries } = searchFor(1)
    await searchAggregatedItems(sp, {
      siteIds: ['child-1'],
      queryTemplate: 'ContentType:Mulighet',
      includeSelf: true,
      selfSiteId: 'program-1',
      siteIdManagedProperty: 'GtSiteIdOWSTEXT'
    })
    expect(queries[0].QueryTemplate).toBe('GtSiteIdOWSTEXT:program-1 ContentType:Mulighet')
    expect(queries[1].QueryTemplate).toContain('GtSiteIdOWSTEXT')
    expect(queries[1].QueryTemplate).toContain('child-1')
  })
})
