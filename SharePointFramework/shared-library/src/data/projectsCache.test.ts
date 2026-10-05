import {
  clearProjectsCache,
  getOrFetchProjectsCache,
  invalidateProjectsCache
} from './projectsCache'

/**
 * The cache in front of the project lists' queries: memory first, the session for the sources
 * worth keeping across page loads, each entry for a while, and one fetch for many callers.
 */
const MINUTE = 60 * 1000

beforeEach(() => {
  clearProjectsCache()
  sessionStorage.clear()
  jest.restoreAllMocks()
})

describe('projectsCache', () => {
  it('fetches once and answers from memory after that', async () => {
    const fetcher = jest.fn(() => Promise.resolve(['Frisbeegolfbane']))
    expect(await getOrFetchProjectsCache('items', 'site-1', fetcher)).toEqual(['Frisbeegolfbane'])
    expect(await getOrFetchProjectsCache('items', 'site-1', fetcher)).toEqual(['Frisbeegolfbane'])
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('keeps each site and source apart', async () => {
    await getOrFetchProjectsCache('items', 'site-1', () => Promise.resolve('a'))
    expect(await getOrFetchProjectsCache('items', 'site-2', () => Promise.resolve('b'))).toBe('b')
    expect(await getOrFetchProjectsCache('users', 'site-1', () => Promise.resolve('c'))).toBe('c')
  })

  it('shares one fetch between callers that ask at the same time', async () => {
    let finish: (value: string[]) => void
    const fetcher = jest.fn(() => new Promise<string[]>((resolve) => (finish = resolve)))
    const first = getOrFetchProjectsCache('sites', 'site-1', fetcher)
    const second = getOrFetchProjectsCache('sites', 'site-1', fetcher)
    finish(['Svømmehall'])
    expect(await first).toEqual(['Svømmehall'])
    expect(await second).toEqual(['Svømmehall'])
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('fetches again once an entry has expired', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(0)
    const fetcher = jest.fn(() => Promise.resolve('verdi'))
    await getOrFetchProjectsCache('items', 'site-1', fetcher, 5)
    now.mockReturnValue(4 * MINUTE)
    await getOrFetchProjectsCache('items', 'site-1', fetcher, 5)
    expect(fetcher).toHaveBeenCalledTimes(1)
    now.mockReturnValue(6 * MINUTE)
    await getOrFetchProjectsCache('items', 'site-1', fetcher, 5)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('keeps the sites, memberships and users in the session, and nothing else', async () => {
    await getOrFetchProjectsCache('sites', 'site-1', () => Promise.resolve(['s1']))
    await getOrFetchProjectsCache('items', 'site-1', () => Promise.resolve(['i1']))
    expect(sessionStorage.getItem('pp365_projects_sites_site-1')).toContain('"s1"')
    expect(sessionStorage.getItem('pp365_projects_items_site-1')).toBeNull()
  })

  it('answers from the session after a page load, until the entry expires there', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(0)
    sessionStorage.setItem(
      'pp365_projects_users_site-1',
      JSON.stringify({ data: ['Kari'], expiresAt: 10 * MINUTE })
    )
    const fetcher = jest.fn(() => Promise.resolve(['Ola']))
    expect(await getOrFetchProjectsCache('users', 'site-1', fetcher)).toEqual(['Kari'])
    expect(fetcher).not.toHaveBeenCalled()

    clearProjectsCache()
    sessionStorage.setItem(
      'pp365_projects_users_site-1',
      JSON.stringify({ data: ['Kari'], expiresAt: 10 * MINUTE })
    )
    now.mockReturnValue(11 * MINUTE)
    expect(await getOrFetchProjectsCache('users', 'site-1', fetcher)).toEqual(['Ola'])
  })

  it('leaves an entry too large for the session in memory only', async () => {
    const large = 'x'.repeat(1_100_000)
    expect(await getOrFetchProjectsCache('sites', 'site-1', () => Promise.resolve(large))).toBe(
      large
    )
    expect(sessionStorage.getItem('pp365_projects_sites_site-1')).toBeNull()
  })

  it('ignores what it cannot read from the session', async () => {
    sessionStorage.setItem('pp365_projects_sites_site-1', '{ not json')
    expect(await getOrFetchProjectsCache('sites', 'site-1', () => Promise.resolve('frisk'))).toBe(
      'frisk'
    )
  })

  it('forgets one entry, or all of them, on request', async () => {
    const fetcher = jest.fn(() => Promise.resolve('verdi'))
    await getOrFetchProjectsCache('sites', 'site-1', fetcher)
    invalidateProjectsCache('sites', 'site-1')
    expect(sessionStorage.getItem('pp365_projects_sites_site-1')).toBeNull()
    await getOrFetchProjectsCache('sites', 'site-1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(2)
    sessionStorage.setItem('annet', 'beholdes')
    clearProjectsCache()
    expect(sessionStorage.getItem('pp365_projects_sites_site-1')).toBeNull()
    expect(sessionStorage.getItem('annet')).toBe('beholdes')
    await getOrFetchProjectsCache('sites', 'site-1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
})
