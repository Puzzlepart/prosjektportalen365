import {
  ChildProject,
  IChildProjectRemoval,
  removeChildProjectsFromProgram
} from './childProjectRemoval'

/**
 * Removing sub-areas from a program: the hubs and the sub-areas' parent links are updated first,
 * the program's own list last. If a hub cannot be updated, the program keeps the sub-areas, as the
 * administration list still shows them after the error, so a second try finishes the job instead
 * of leaving the hub and the program apart.
 */
const ALFA = { SiteId: 'site-alfa', HubSiteId: 'hub-1', Title: 'Alfa' }
const BETA = { SiteId: 'site-beta', HubSiteId: 'hub-1', Title: 'Beta' }
const GAMMA = { SiteId: 'site-gamma', HubSiteId: 'hub-2', Title: 'Gamma' }

/** A program listing three sub-areas, with every write recorded in `calls`. */
function program(hubUpdate: () => Promise<void> = () => Promise.resolve()) {
  const calls: string[] = []
  const writeChildProjects = jest.fn((properties: { GtChildProjects: string }) => {
    const titles = JSON.parse(properties.GtChildProjects).map((p: ChildProject) => p.Title)
    calls.push(`program list: ${titles}`)
    return Promise.resolve()
  })
  const operations: IChildProjectRemoval = {
    readChildProjects: () => Promise.resolve([ALFA, BETA, GAMMA]),
    writeChildProjects,
    updateHub: async (_properties, hubSiteId) => {
      calls.push(`hub ${hubSiteId}`)
      await hubUpdate()
    },
    removeParent: (siteId) => {
      calls.push(`parent of ${siteId}`)
      return Promise.resolve()
    }
  }
  return { operations, writeChildProjects, calls }
}

describe('removeChildProjectsFromProgram', () => {
  it('updates the hubs and the parent links first, and the program last', async () => {
    const { operations, calls } = program()
    const remaining = await removeChildProjectsFromProgram(operations, [ALFA, GAMMA])
    expect(remaining.map((p) => p.Title)).toEqual(['Beta'])
    expect(calls[calls.length - 1]).toBe('program list: Beta')
    expect(calls.slice(0, -1).sort()).toEqual([
      'hub hub-1',
      'hub hub-2',
      'parent of site-alfa',
      'parent of site-gamma'
    ])
  })

  it('leaves the program as it was when a hub cannot be updated', async () => {
    const { operations, writeChildProjects } = program(() =>
      Promise.reject(new Error('Hub utilgjengelig'))
    )
    await expect(removeChildProjectsFromProgram(operations, [ALFA])).rejects.toThrow(
      'Hub utilgjengelig'
    )
    expect(writeChildProjects).not.toHaveBeenCalled()
  })

  it('leaves a sub-area without a hub out of the hub and parent updates', async () => {
    const { operations, calls } = program()
    await removeChildProjectsFromProgram(operations, [{ SiteId: 'site-alfa', HubSiteId: '' }])
    expect(calls).toEqual(['program list: Beta,Gamma'])
  })
})
