import { fetchMergedViewData, mergePortfolioViewData, replaceDepartmentId } from './mergedViewData'
import { PortfolioInstance } from './types'

/**
 * The merged view of the portfolio overview: the rows of several hubs as one list, each row with
 * its hub, a view's search scoped to each hub, and a hub that cannot be read left out and named.
 */
const portfolio = (uniqueId: string, extra: Partial<PortfolioInstance> = {}): PortfolioInstance =>
  ({
    uniqueId,
    title: `Hub ${uniqueId.toUpperCase()}`,
    url: `https://contoso.sharepoint.com/sites/${uniqueId}`,
    ...extra
  }) as PortfolioInstance

const row = (SiteId: string, extra: Record<string, any> = {}) => ({ SiteId, ...extra }) as any

describe('replaceDepartmentId', () => {
  it("scopes a view's search to another hub, however many times and however it is written", () => {
    expect(
      replaceDepartmentId(
        'DepartmentId:{aaaaaaaa-0000-0000-0000-000000000000} OR departmentid:{BBBBBBBB-0000-0000-0000-000000000000}',
        'cccccccc-0000-0000-0000-000000000000'
      )
    ).toBe(
      'DepartmentId:{cccccccc-0000-0000-0000-000000000000} OR DepartmentId:{cccccccc-0000-0000-0000-000000000000}'
    )
  })

  it('leaves a query without a hub as it is', () => {
    expect(replaceDepartmentId('contentclass:STS_Site', 'c')).toBe('contentclass:STS_Site')
  })
})

describe('mergePortfolioViewData', () => {
  it('gives every row its hub, keeps the same project from two hubs as two rows, and no row twice', () => {
    const a = portfolio('a')
    const b = portfolio('b')
    const { items } = mergePortfolioViewData([
      { portfolio: a, data: { items: [row('1'), row('1'), row('2', { ScopeKey: 'x' })] } },
      { portfolio: b, data: { items: [row('1'), row('3')] } }
    ])
    expect(items.map((item) => `${item.SiteId}@${item._hubTitle}`)).toEqual([
      '1@Hub A',
      '2@Hub A',
      '1@Hub B',
      '3@Hub B'
    ])
    expect(items[0]).toMatchObject({ _hubId: 'a', _hubUrl: a.url })
  })

  it('unites the managed properties, each once', () => {
    const { managedProperties } = mergePortfolioViewData([
      { portfolio: portfolio('a'), data: { items: [], managedProperties: ['Title', 'Phase'] } },
      { portfolio: portfolio('b'), data: { items: [], managedProperties: ['Phase', 'Budget'] } },
      { portfolio: portfolio('c'), data: { items: [] } }
    ])
    expect(managedProperties).toEqual(['Title', 'Phase', 'Budget'])
  })
})

describe('fetchMergedViewData', () => {
  const a = portfolio('a')
  const b = portfolio('b')
  const c = portfolio('c')

  it('reads the primary portfolio as the view does and the others against their hubs, and merges them', async () => {
    const fetchPrimary = jest.fn(() => Promise.resolve({ items: [row('1')] }))
    const fetchOther = jest.fn((p: PortfolioInstance) =>
      Promise.resolve({ items: [row(p.uniqueId)] })
    )
    const data = await fetchMergedViewData([a, b, c], fetchPrimary, fetchOther)
    expect(fetchPrimary).toHaveBeenCalledWith(a)
    expect(fetchOther.mock.calls.map(([p]) => p)).toEqual([b, c])
    expect(data.items.map((item) => item._hubTitle)).toEqual(['Hub A', 'Hub B', 'Hub C'])
    expect(data.failedPortfolios).toEqual([])
  })

  it('leaves a hub that cannot be read out, names it, and tells of it; the others are shown', async () => {
    const onError = jest.fn()
    const data = await fetchMergedViewData(
      [a, b, c],
      () => Promise.resolve({ items: [row('1')] }),
      (p) => (p === b ? Promise.reject(new Error('403')) : Promise.resolve({ items: [row('3')] })),
      onError
    )
    expect(data.items.map((item) => item._hubTitle)).toEqual(['Hub A', 'Hub C'])
    expect(data.failedPortfolios).toEqual([b])
    expect(onError).toHaveBeenCalledWith(b, expect.objectContaining({ message: '403' }))
  })

  it('fails as the view does when the primary portfolio cannot be read', async () => {
    await expect(
      fetchMergedViewData(
        [a, b],
        () => Promise.reject(new Error('503')),
        () => Promise.resolve({ items: [] })
      )
    ).rejects.toThrow('503')
  })

  it('reads only the portfolios included, and nothing when none is', async () => {
    const fetchOther = jest.fn(() => Promise.resolve({ items: [row('2')] }))
    const data = await fetchMergedViewData(
      [a, portfolio('b', { includeInMergedView: false }), c],
      () => Promise.resolve({ items: [row('1')] }),
      fetchOther
    )
    expect(fetchOther).toHaveBeenCalledTimes(1)
    expect(fetchOther).toHaveBeenCalledWith(c)
    expect(data.items).toHaveLength(2)
    const none = await fetchMergedViewData(
      [portfolio('a', { includeInMergedView: false })],
      () => Promise.reject(new Error('not called')),
      fetchOther
    )
    expect(none).toEqual({ items: [], managedProperties: [], failedPortfolios: [] })
  })
})
