// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. `hub` stands in for the hub's search.
const hub = { search: jest.fn(), siteId: '{AAAA-1111}' }
jest.mock('@pnp/sp', () => ({
  ...jest.requireActual('@pnp/sp'),
  spfi: () => ({
    site: { select: () => () => Promise.resolve({ Id: hub.siteId }) },
    search: hub.search
  })
}))

import { fetchShieldedStatusReports } from './fetchShieldedStatusReports'

const COLUMNS = [
  { GtInternalName: 'GtStatusTime', GtManagedProperty: 'GtStatusTimeOWSCHCS' },
  { GtInternalName: 'GtStatusTimeComment', GtManagedProperty: 'GtStatusTimeCommentOWSMTXT' }
]

describe('fetchShieldedStatusReports', () => {
  beforeEach(() => hub.search.mockReset())

  it("gives the shielded projects' reports in the shape of the hub list's items", async () => {
    hub.search.mockResolvedValue({
      PrimarySearchResults: [
        {
          GtSiteIdOWSTEXT: 'site-2',
          Created: '2026-11-01T10:00:00Z',
          SiteId: 'site-2',
          GtStatusTimeOWSCHCS: 'I rute',
          GtStatusTimeCommentOWSMTXT: 'Som planlagt'
        }
      ]
    })
    expect(await fetchShieldedStatusReports({} as any, COLUMNS)).toEqual([
      {
        GtSiteId: 'site-2',
        Created: '2026-11-01T10:00:00Z',
        GtStatusTime: 'I rute',
        GtStatusTimeComment: 'Som planlagt'
      }
    ])
    const [[query]] = hub.search.mock.calls
    expect(query.Querytext).toContain('DepartmentId:{aaaa-1111}')
    expect(query.Querytext).toContain('-SiteId:aaaa-1111')
    expect(query.SelectProperties).toEqual(
      expect.arrayContaining(['GtStatusTimeOWSCHCS', 'GtStatusTimeCommentOWSMTXT'])
    )
  })

  it("leaves out the hub's own reports, which are read from its list", async () => {
    hub.search.mockResolvedValue({
      PrimarySearchResults: [{ GtSiteIdOWSTEXT: 'site-1', SiteId: 'AAAA-1111' }]
    })
    expect(await fetchShieldedStatusReports({} as any, COLUMNS)).toEqual([])
  })

  it('does not search without status columns, nor with a column that has no managed property', async () => {
    expect(await fetchShieldedStatusReports({} as any, [])).toEqual([])
    expect(
      await fetchShieldedStatusReports({} as any, [
        { GtInternalName: 'GtStatusTime', GtManagedProperty: '' }
      ])
    ).toEqual([])
    expect(hub.search).not.toHaveBeenCalled()
  })

  it('gives none when search fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    hub.search.mockRejectedValue(new Error('500'))
    expect(await fetchShieldedStatusReports({} as any, COLUMNS)).toEqual([])
  })
})
