import {
  HUB_SITE_PROJECT_ITEM_PROPERTIES,
  HUB_SITE_PROJECT_SITE_PROPERTIES,
  hubSiteProjectsCacheKey,
  toHubSiteProjects,
  toStoredChildProject
} from './hubSiteProjects'

/**
 * The projects a program can hold, as search finds them in the program's hubs: each project item
 * joined with its site, with the site's creation date and the project's phase for the lists to
 * show. Those two are for display only and never reach `GtChildProjects`, which keeps what it
 * stored in 1.14.
 */
const HUBS = [
  { url: 'https://t.sharepoint.com/sites/hub1', hubSiteId: 'hub-1', title: 'Hub 1' },
  { url: 'https://t.sharepoint.com/sites/hub2', hubSiteId: 'hub-2', title: 'Hub 2' }
]

const SITES = [
  {
    SiteId: 'site-a',
    Title: 'Alfa',
    SPWebUrl: 'https://t.sharepoint.com/sites/alfa',
    Path: 'https://t.sharepoint.com/sites/alfa',
    DepartmentId: '{HUB-1}',
    Created: '2024-03-01T09:00:00.0000000Z'
  },
  {
    SiteId: 'site-b',
    Title: 'Bravo',
    SPWebUrl: 'https://t.sharepoint.com/sites/bravo',
    Path: 'https://t.sharepoint.com/sites/bravo',
    DepartmentId: '{hub-2}'
  }
]

describe('hubSiteProjects', () => {
  it('reads the sites’ creation date and the projects’ phase from search', () => {
    expect(HUB_SITE_PROJECT_SITE_PROPERTIES).toContain('Created')
    expect(HUB_SITE_PROJECT_ITEM_PROPERTIES).toContain('GtProjectPhaseTextOWSTEXT')
  })

  it('joins each project item with its site and hub, with the creation date and the phase', () => {
    const projects = toHubSiteProjects(
      [
        { GtSiteIdOWSTEXT: 'site-a', Title: 'Alfa (item)', GtProjectPhaseTextOWSTEXT: 'Konsept' },
        { GtSiteIdOWSTEXT: 'site-b', Title: 'Bravo (item)' }
      ],
      SITES,
      HUBS
    )
    expect(projects).toEqual([
      {
        SiteId: 'site-a',
        Title: 'Alfa',
        SPWebURL: 'https://t.sharepoint.com/sites/alfa',
        Path: 'https://t.sharepoint.com/sites/alfa',
        HubSiteId: 'hub-1',
        HubSiteUrl: 'https://t.sharepoint.com/sites/hub1',
        HubSiteTitle: 'Hub 1',
        Created: '2024-03-01T09:00:00.0000000Z',
        Phase: 'Konsept'
      },
      {
        SiteId: 'site-b',
        Title: 'Bravo',
        SPWebURL: 'https://t.sharepoint.com/sites/bravo',
        Path: 'https://t.sharepoint.com/sites/bravo',
        HubSiteId: 'hub-2',
        HubSiteUrl: 'https://t.sharepoint.com/sites/hub2',
        HubSiteTitle: 'Hub 2'
      }
    ])
  })

  it('leaves out items without a site id, with the empty site id, or whose site search did not find', () => {
    const projects = toHubSiteProjects(
      [
        { Title: 'Uten område' },
        { GtSiteIdOWSTEXT: '00000000-0000-0000-0000-000000000000', Title: 'Tomt område' },
        { GtSiteIdOWSTEXT: 'site-x', Title: 'Ukjent område' },
        { GtSiteIdOWSTEXT: 'site-b', Title: 'Bravo' }
      ],
      SITES,
      HUBS
    )
    expect(projects.map((project) => project.SiteId)).toEqual(['site-b'])
  })

  it('takes the item’s title when the site has none', () => {
    const [project] = toHubSiteProjects(
      [{ GtSiteIdOWSTEXT: 'site-c', Title: 'Charlie' }],
      [{ SiteId: 'site-c', DepartmentId: '{hub-1}' }],
      HUBS
    )
    expect(project.Title).toBe('Charlie')
  })

  it('keeps the cache apart from rows cached without the new fields, whatever the order of the hubs', () => {
    const hubSiteIds = ['hub-2', 'hub-1']
    expect(hubSiteProjectsCacheKey(hubSiteIds)).toBe('HubSiteProjects_v2_hub-1_hub-2')
    expect(hubSiteIds).toEqual(['hub-2', 'hub-1'])
  })

  it('stores a child project without the fields that are only shown', () => {
    expect(
      toStoredChildProject({
        key: 'site-a',
        SiteId: 'site-a',
        Title: 'Alfa',
        HubSiteId: 'hub-1',
        Created: '2024-03-01T09:00:00.0000000Z',
        Phase: 'Konsept'
      })
    ).toEqual({ key: 'site-a', SiteId: 'site-a', Title: 'Alfa', HubSiteId: 'hub-1' })
  })
})
