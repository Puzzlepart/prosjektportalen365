import { syncPhaseToHub } from './syncPhaseToHub'

const SITE_ID = 'a1b2c3d4-0000-4000-8000-000000000002'
const PHASE = { GtProjectPhaseTaxHTField: 'Gjennomføre|term-3', GtProjectPhaseText: 'Gjennomføre' }

/** The hub's project list, with the project's entity or without one. */
function hub(entity?: Record<string, any>) {
  return {
    getEntityItem: jest.fn(() => Promise.resolve(entity)),
    updateEntityItem: jest.fn(() => Promise.resolve())
  } as any
}

describe('syncPhaseToHub', () => {
  it("writes the phase to the project's entity", async () => {
    const entityService = hub({ Id: 7 })
    const registerProject = jest.fn(() => Promise.resolve())
    await syncPhaseToHub(entityService, SITE_ID, PHASE, registerProject)
    expect(registerProject).not.toHaveBeenCalled()
    expect(entityService.updateEntityItem).toHaveBeenCalledWith(SITE_ID, PHASE)
  })

  it('registers a project without an entity first, then writes the phase to it', async () => {
    const entityService = hub()
    const calls: string[] = []
    const registerProject = jest.fn(() => {
      calls.push('register')
      return Promise.resolve()
    })
    entityService.updateEntityItem.mockImplementation(() => {
      calls.push('update')
      return Promise.resolve()
    })
    await syncPhaseToHub(entityService, SITE_ID, PHASE, registerProject)
    expect(calls).toEqual(['register', 'update'])
  })

  it('passes on what the hub rejects', async () => {
    const entityService = hub()
    const denied = Object.assign(new Error('Access is denied.'), { status: 403 })
    await expect(
      syncPhaseToHub(entityService, SITE_ID, PHASE, () => Promise.reject(denied))
    ).rejects.toBe(denied)
    expect(entityService.updateEntityItem).not.toHaveBeenCalled()
  })
})
