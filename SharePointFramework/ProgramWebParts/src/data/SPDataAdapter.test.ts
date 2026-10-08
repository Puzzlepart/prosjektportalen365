import { SPDataAdapter } from './SPDataAdapter'

/**
 * Removing sub-areas from a program: the hubs and the sub-areas' parent links are updated first,
 * the program's own list (`GtChildProjects` on its property item) last. If a hub cannot be updated,
 * the program keeps the sub-areas, as the administration list still shows them after the error, so
 * a second try finishes the job instead of leaving the hub and the program apart.
 */
const ALFA = { SiteId: 'site-alfa', HubSiteId: 'hub-1', Title: 'Alfa' }
const BETA = { SiteId: 'site-beta', HubSiteId: 'hub-1', Title: 'Beta' }
const GAMMA = { SiteId: 'site-gamma', HubSiteId: 'hub-2', Title: 'Gamma' }

/** An adapter on a program listing three sub-areas, with the hub calls recorded in `calls`. */
function adapter(hubUpdate: () => Promise<void> = () => Promise.resolve()) {
  const calls: string[] = []
  const update = jest.fn(async (properties: Record<string, string>) => {
    calls.push(`program list: ${JSON.parse(properties.GtChildProjects).map((p: any) => p.Title)}`)
  })
  const instance = new SPDataAdapter() as any
  instance._propertyItem = {
    select: () => async () => ({ GtChildProjects: JSON.stringify([ALFA, BETA, GAMMA]) }),
    update
  }
  instance.updateProjectInHub = jest.fn(async (_properties: unknown, hubSiteId: string) => {
    calls.push(`hub ${hubSiteId}`)
    await hubUpdate()
  })
  instance._updateChildProjectParents = jest.fn(async (siteId: string) => {
    calls.push(`parent of ${siteId}`)
  })
  return { instance: instance as SPDataAdapter, update, calls }
}

describe('SPDataAdapter.removeChildProjects', () => {
  it('updates the hubs and the parent links first, and the program last', async () => {
    const { instance, calls } = adapter()
    const remaining = await instance.removeChildProjects([ALFA, GAMMA])
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
    const { instance, update } = adapter(() => Promise.reject(new Error('Hub utilgjengelig')))
    await expect(instance.removeChildProjects([ALFA])).rejects.toThrow('Hub utilgjengelig')
    expect(update).not.toHaveBeenCalled()
  })
})
