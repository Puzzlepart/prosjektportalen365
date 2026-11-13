// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The hub data service that is made for a command set without
// one is the test's stand-in.
const mockPortalDataService = { configure: jest.fn() }
jest.mock('pp365-shared-library/lib/services/PortalDataService', () => ({
  PortalDataService: class {
    public configure(configuration: unknown) {
      return mockPortalDataService.configure(configuration)
    }
  }
}))

import { getTelemetryGate } from 'pp365-shared-library/lib/telemetry'
import {
  hubPortal,
  ITelemetryTestBed,
  PROJECT_SITE_ID,
  settingsMap,
  settle,
  spfxTestContext,
  telemetryStore,
  telemetryTestBed
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import {
  startCommandSetTelemetry,
  startCommandSetTelemetryWithOwnPortal
} from './commandSetTelemetry'

/**
 * How a list view command set starts usage statistics: the page, the hub's data service without
 * settings (so the level is read through it) and how to tell what kind of site the page is on.
 * The hub is the telemetry fixtures' stand-in.
 */
let bed: ITelemetryTestBed

/** A command set's context on the hub, or on a project of it. */
const context = (page: 'hub' | 'project' = 'hub') =>
  spfxTestContext({ page, alias: 'IdeaProcessing' }) as any

beforeEach(() => {
  bed = telemetryTestBed()
  mockPortalDataService.configure.mockReset()
})

afterEach(() => bed.restore())

describe('startCommandSetTelemetry', () => {
  it("reads the hub's level through the data service, which is given no settings", async () => {
    const portal = hubPortal(settingsMap('2'))
    startCommandSetTelemetry(context(), portal)
    // The level is not read yet: the gate is closed.
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'pending' })
    await settle()
    expect(getTelemetryGate()).toEqual({ level: 2, catalog: true, reason: 'setting' })
    expect(portal.getGlobalSettings).toHaveBeenCalledTimes(1)
    // A page on the hub is a hub page: nobody is asked what kind of site it is.
    expect(portal.getSiteKind).not.toHaveBeenCalled()
  })

  it.each([
    ['asks', '2', 1],
    ['does not ask', '1', 0]
  ])('%s what kind of site a page outside the hub is on at level %s', async (_, level, calls) => {
    const portal = hubPortal(settingsMap(level))
    startCommandSetTelemetry(context('project'), portal)
    await settle()
    await settle()
    expect(portal.getSiteKind).toHaveBeenCalledTimes(calls)
    if (calls) expect(portal.getSiteKind).toHaveBeenCalledWith(PROJECT_SITE_ID)
  })

  it('drops whatever goes wrong, and starts nothing on a context it cannot read', () => {
    expect(() => startCommandSetTelemetry({} as any, hubPortal())).not.toThrow()
    expect(telemetryStore()).toBeUndefined()
  })
})

describe('startCommandSetTelemetryWithOwnPortal', () => {
  it('makes the hub data service a command set without one needs, and starts with it', async () => {
    const portal = hubPortal(settingsMap('3'))
    mockPortalDataService.configure.mockResolvedValue(portal)
    const spfxContext = context()
    await startCommandSetTelemetryWithOwnPortal(spfxContext)
    expect(mockPortalDataService.configure).toHaveBeenCalledWith({ spfxContext })
    await settle()
    expect(getTelemetryGate()).toMatchObject({ level: 3, catalog: true })
  })

  it('never rejects: without a data service nothing starts', async () => {
    mockPortalDataService.configure.mockRejectedValue(new Error('Ingen kontekst'))
    await expect(startCommandSetTelemetryWithOwnPortal(context())).resolves.toBeUndefined()
    expect(telemetryStore()).toBeUndefined()
  })
})
