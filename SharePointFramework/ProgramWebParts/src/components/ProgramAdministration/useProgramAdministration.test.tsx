import { render, waitFor } from '@testing-library/react'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  clearTestTelemetry,
  countedTelemetry,
  startTestTelemetry,
  telemetryStore
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { useProgramAdministration } from './useProgramAdministration'

/**
 * The hubs the program administration reads its projects from: those the global setting
 * `AvailableProgramHubs` names, each resolved to its id and title, or the program's own hub when
 * the setting is empty or disabled. Without that fallback the list and the add dialog were empty.
 */
const HUB = 'https://contoso.sharepoint.com/sites/pp365'
const OTHER = 'https://contoso.sharepoint.com/sites/pp365-bygg'
const ALFA = { SiteId: 'a', Title: 'Alfa' }
/** Alfa as the list gets it: the reducer keys each row by its site id. */
const ALFA_ROW = { key: ALFA.SiteId, ...ALFA }

/** The hub a URL resolves to in these tests: its id and title from the URL's last segment. */
const resolved = (url: string) => {
  const name = url.split('/').pop()
  return { url, hubSiteId: `id-${name}`, title: name }
}

function adapter(availableProgramHubs: string | undefined) {
  return {
    project: { getProjectInformationData: jest.fn(() => Promise.resolve({ fieldValues: {} })) },
    checkProjectAdminPermissions: jest.fn(() => Promise.resolve(true)),
    globalSettings: {
      get: jest.fn((key: string) =>
        key === 'AvailableProgramHubs' ? availableProgramHubs : undefined
      )
    },
    portalDataService: {
      url: HUB,
      resolveHubSiteFromUrl: jest.fn((url: string) => {
        const { hubSiteId, title } = resolved(url)
        return Promise.resolve({ hubSiteId, title })
      })
    },
    initializeHubWebs: jest.fn(),
    fetchChildProjects: jest.fn(() => Promise.resolve([ALFA]))
  }
}

/** Runs the hook as the program administration web part does, which usage is counted for. */
function renderHook(dataAdapter: ReturnType<typeof adapter>) {
  let result: ReturnType<typeof useProgramAdministration>
  const Probe: React.FC = () => {
    result = useProgramAdministration({ dataAdapter } as any)
    return null
  }
  render(
    <TelemetryProvider component='ProgramAdministrationWebpart'>
      <Probe />
    </TelemetryProvider>
  )
  return () => result
}

beforeEach(() => startTestTelemetry())
afterEach(() => clearTestTelemetry())

describe('useProgramAdministration', () => {
  it('reads the hubs from the global setting, resolves each, and fetches the projects from them', async () => {
    const dataAdapter = adapter(`${HUB}; ${OTHER};`)
    const result = renderHook(dataAdapter)
    await waitFor(() =>
      expect(dataAdapter.fetchChildProjects).toHaveBeenCalledWith([resolved(HUB), resolved(OTHER)])
    )
    expect(dataAdapter.initializeHubWebs).toHaveBeenCalledWith([resolved(HUB), resolved(OTHER)])
    await waitFor(() => expect(result().childProjects).toEqual([ALFA_ROW]))
    expect(result().programHubs).toEqual([resolved(HUB), resolved(OTHER)])
    // An administration that gets its data counts no error.
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
  })

  it("falls back to the program's own hub when the setting is empty or disabled, so the administration is not empty", async () => {
    // A disabled setting is absent from the global settings: nothing was read, and the list and
    // the add dialog stayed empty, with no word of why.
    const dataAdapter = adapter(undefined)
    const result = renderHook(dataAdapter)
    await waitFor(() =>
      expect(dataAdapter.fetchChildProjects).toHaveBeenCalledWith([resolved(HUB)])
    )
    await waitFor(() => expect(result().childProjects).toEqual([ALFA_ROW]))
    expect(result().programHubs).toEqual([resolved(HUB)])
  })

  it('leaves the hubs unknown, and the list empty, when a hub cannot be resolved', async () => {
    const dataAdapter = adapter(OTHER)
    dataAdapter.portalDataService.resolveHubSiteFromUrl.mockImplementation(() =>
      Promise.reject(new Error('404'))
    )
    const result = renderHook(dataAdapter)
    // Done when the data is loaded: the list is empty from the start, so it alone proves nothing.
    await waitFor(() => expect(result().context.state.loading).toBe(false))
    expect(result().context.state.childProjects).toEqual([])
    expect(dataAdapter.fetchChildProjects).not.toHaveBeenCalled()
    expect(result().programHubs).toBeUndefined()
  })

  describe('and usage statistics', () => {
    it('counts a hub that cannot be resolved once, by the status SharePoint answered with', async () => {
      const dataAdapter = adapter(`${HUB};${OTHER}`)
      const missing = Object.assign(new Error(`Fant ikke ${OTHER}`), { status: 404 })
      dataAdapter.portalDataService.resolveHubSiteFromUrl.mockImplementation((url: string) =>
        url === OTHER ? Promise.reject(missing) : Promise.resolve(resolved(url))
      )
      const result = renderHook(dataAdapter)
      await waitFor(() => expect(result().context.state.loading).toBe(false))
      // The list is empty, with no word of why: of the error, only its code and status are kept.
      expect(countedTelemetry()).toEqual({
        usage: {},
        errors: { 'ProgramAdministrationWebpart not_found 404': 1 },
        timings: {}
      })
      expect(JSON.stringify(telemetryStore())).not.toContain('pp365-bygg')
    })

    it('counts child projects that cannot be read once, by the status SharePoint answered with', async () => {
      const dataAdapter = adapter(undefined)
      const denied = Object.assign(new Error('Ingen tilgang til Prosjektegenskaper'), {
        status: 403
      })
      dataAdapter.fetchChildProjects.mockImplementation(() => Promise.reject(denied))
      // The hook logs the error it is given.
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      try {
        const result = renderHook(dataAdapter)
        await waitFor(() => expect(result().context.state.loading).toBe(false))
        expect(result().childProjects).toEqual([])
        expect(result().programHubs).toEqual([resolved(HUB)])
        expect(consoleError).toHaveBeenCalledWith('Failed to fetch child projects:', denied)
        expect(countedTelemetry()).toEqual({
          usage: {},
          errors: { 'ProgramAdministrationWebpart permission_denied 403': 1 },
          timings: {}
        })
      } finally {
        consoleError.mockRestore()
      }
    })
  })
})
