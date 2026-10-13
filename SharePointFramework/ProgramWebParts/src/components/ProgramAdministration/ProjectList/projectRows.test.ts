import { createProjectRows } from './projectRows'

/**
 * The rows of the program administration's lists: filtered by the search, sorted by the chosen
 * column, and, when the projects come from more than one hub, gathered per hub in the hubs' order
 * by name, sorted within each, as the portfolio overview groups. A group of fewer than ten
 * projects starts open, a larger one closed, unless the list opens them all or a search is
 * active.
 */
const HUBS = [
  { url: 'https://t.sharepoint.com/sites/vest', hubSiteId: 'hub-vest', title: 'Vest' },
  { url: 'https://t.sharepoint.com/sites/ost', hubSiteId: 'hub-ost', title: 'Øst' },
  { url: 'https://t.sharepoint.com/sites/nord', hubSiteId: 'hub-nord', title: 'Nord' }
]

const project = (SiteId: string, Title: string, HubSiteId = 'hub-vest', Created?: string) => ({
  SiteId,
  Title,
  HubSiteId,
  Created
})

const titles = (rows: Record<string, any>[]) => rows.map((row) => row.Title)

const BY_TITLE = { fieldName: 'Title', ascending: true }

describe('createProjectRows', () => {
  it('filters on the title, ignoring case, and sorts by title', () => {
    const { rows, groups } = createProjectRows(
      [
        project('c', 'Charlie'),
        project('a', 'alfa'),
        project('b', 'Bravo'),
        project('d', 'Alfabet')
      ],
      { searchTerm: 'ALF', sort: BY_TITLE, programHubs: HUBS }
    )
    expect(titles(rows)).toEqual(['alfa', 'Alfabet'])
    expect(groups).toBeUndefined()
  })

  it('sorts descending, and dates by date', () => {
    const projects = [
      project('a', 'Alfa', 'hub-vest', '2023-05-01T00:00:00Z'),
      project('b', 'Bravo', 'hub-vest', '2021-01-15T00:00:00Z'),
      project('c', 'Charlie', 'hub-vest', '2024-11-30T00:00:00Z')
    ]
    expect(
      titles(createProjectRows(projects, { sort: { fieldName: 'Title', ascending: false } }).rows)
    ).toEqual(['Charlie', 'Bravo', 'Alfa'])
    expect(
      titles(createProjectRows(projects, { sort: { fieldName: 'Created', ascending: true } }).rows)
    ).toEqual(['Bravo', 'Alfa', 'Charlie'])
    expect(
      titles(createProjectRows(projects, { sort: { fieldName: 'Created', ascending: false } }).rows)
    ).toEqual(['Charlie', 'Alfa', 'Bravo'])
  })

  it('gathers projects from several hubs per hub, the hubs by name and each sorted within', () => {
    const { rows, groups } = createProjectRows(
      [
        project('v2', 'Vest 2', 'hub-vest'),
        project('o1', 'Øst 1', 'hub-ost'),
        project('n1', 'Nord 1', 'hub-nord'),
        project('v1', 'Vest 1', 'hub-vest')
      ],
      { sort: BY_TITLE, programHubs: HUBS }
    )
    expect(titles(rows)).toEqual(['Nord 1', 'Vest 1', 'Vest 2', 'Øst 1'])
    expect(groups).toEqual([
      { key: 'hub-nord', name: 'Nord', startIndex: 0, count: 1, isCollapsed: false },
      { key: 'hub-vest', name: 'Vest', startIndex: 1, count: 2, isCollapsed: false },
      { key: 'hub-ost', name: 'Øst', startIndex: 3, count: 1, isCollapsed: false }
    ])
  })

  it('names a hub the program does not list by the title or address the row carries', () => {
    const { groups } = createProjectRows(
      [
        { ...project('a', 'Alfa', 'hub-x'), HubSiteTitle: 'Annen hub' },
        { ...project('b', 'Bravo', 'hub-y'), HubSiteUrl: 'https://t.sharepoint.com/sites/y' }
      ],
      { sort: BY_TITLE, programHubs: [] }
    )
    expect(groups.map((group) => group.name)).toEqual([
      'Annen hub',
      'https://t.sharepoint.com/sites/y'
    ])
  })

  it('opens groups of fewer than ten at once, larger ones on request, and all of them in a search or when asked', () => {
    const many = Array.from({ length: 10 }, (_, i) => project(`v${i}`, `Vest ${i}`, 'hub-vest'))
    const projects = [...many, project('o1', 'Øst 1', 'hub-ost')]
    const collapsed = (options: Partial<Parameters<typeof createProjectRows>[1]>) =>
      createProjectRows(projects, { sort: BY_TITLE, programHubs: HUBS, ...options }).groups.map(
        (group) => group.isCollapsed
      )
    expect(collapsed({})).toEqual([true, false])
    expect(collapsed({ defaultGroupsExpanded: true })).toEqual([false, false])
    expect(collapsed({ searchTerm: 'vest' })).toEqual([false])
  })

  it('keeps the grouping while a search finds projects in one hub only', () => {
    const { rows, groups } = createProjectRows(
      [project('v1', 'Vest 1', 'hub-vest'), project('o1', 'Øst 1', 'hub-ost')],
      { searchTerm: 'øst', sort: BY_TITLE, programHubs: HUBS }
    )
    expect(titles(rows)).toEqual(['Øst 1'])
    expect(groups).toEqual([
      { key: 'hub-ost', name: 'Øst', startIndex: 0, count: 1, isCollapsed: false }
    ])
  })
})
