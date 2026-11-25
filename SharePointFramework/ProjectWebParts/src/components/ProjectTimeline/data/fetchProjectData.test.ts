// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter is a stand-in: `adapter.shielded` says whether
// the project is shielded, the project site and the hub each answer with their one item or fail
// with `adapter.error`, and `adapter.queries` records which of them was asked, and how.
const adapter = {
  shielded: false,
  error: undefined as unknown,
  local: [] as Record<string, any>[],
  hub: [] as Record<string, any>[],
  queries: [] as { web: string; list: string; calls: any[][] }[]
}
function standInWeb(web: 'project' | 'hub') {
  return {
    lists: {
      getByTitle: (list: string) => ({
        get items() {
          const calls: any[][] = []
          adapter.queries.push({ web, list, calls })
          const query: any = () =>
            adapter.error
              ? Promise.reject(adapter.error)
              : Promise.resolve(web === 'hub' ? adapter.hub : adapter.local)
          for (const name of ['select', 'filter', 'top']) {
            query[name] = (...args: any[]) => {
              calls.push([name, ...args])
              return query
            }
          }
          return query
        }
      })
    }
  }
}
jest.mock('data/SPDataAdapter', () => ({
  __esModule: true,
  default: {
    get isShieldedProject() {
      return adapter.shielded
    },
    sp: { web: standInWeb('project') },
    portalDataService: { web: standInWeb('hub') }
  }
}))

import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import resource from 'SharedResources'
import { fetchProjectData } from './fetchProjectData'

const PROPS = { siteId: 'site-2', webTitle: 'Frisbeegolfbane' } as any

beforeEach(() => {
  adapter.shielded = false
  adapter.error = undefined
  adapter.local = [
    { Id: 1, GtStartDate: '2026-01-05T00:00:00Z', GtEndDate: '2026-12-18T00:00:00Z' }
  ]
  adapter.hub = [{ Id: 42, GtStartDate: '2025-03-01T00:00:00Z', GtEndDate: '2025-09-30T00:00:00Z' }]
  adapter.queries = []
})

describe('fetchProjectData', () => {
  it("reads the project's period from its entry in the hub, found by its site ID, and names that entry for new timeline items", async () => {
    const { project, projectId } = await fetchProjectData(PROPS, [])
    expect(adapter.queries.map(({ web, list }) => [web, list])).toEqual([
      ['hub', resource.Lists_Projects_Title]
    ])
    expect(adapter.queries[0].calls).toContainEqual(['filter', "GtSiteId eq 'site-2'"])
    expect(projectId).toBe(42)
    expect(project.title).toBe('Frisbeegolfbane')
  })

  it("reads a shielded project's period from its own properties item, asks the hub for nothing, and names no entry there", async () => {
    adapter.shielded = true
    const { project, projectId } = await fetchProjectData(PROPS, [])
    expect(adapter.queries.map(({ web, list }) => [web, list])).toEqual([
      ['project', resource.Lists_ProjectProperties_Title]
    ])
    // Nothing links a new timeline item to the project: it has no entry in the hub.
    expect(projectId).toBeUndefined()
    expect(project.title).toBe('Frisbeegolfbane')
  })

  it('shows the project without a period when it has no item to read one from', async () => {
    adapter.shielded = true
    adapter.local = []
    const { project, projectId } = await fetchProjectData(PROPS, [])
    expect(projectId).toBeUndefined()
    expect(project.title).toBe('Frisbeegolfbane')
  })

  it('passes a denied read on as it is, and tells of any other failure with the project it was for', async () => {
    adapter.shielded = true
    adapter.error = Object.assign(new Error('403 FORBIDDEN'), { status: 403 })
    await expect(fetchProjectData(PROPS, [])).rejects.toBe(adapter.error)
    adapter.error = new Error('500 Server Error')
    const failure = await fetchProjectData(PROPS, []).catch((error) => error)
    expect(failure.message).toBe(
      format(strings.ProjectTimelineErrorFetchText, 'site-2', 'Frisbeegolfbane', adapter.error)
    )
    expect(failure.cause).toBe(adapter.error)
  })
})
