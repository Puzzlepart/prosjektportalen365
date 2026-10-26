import { render, waitFor } from '@testing-library/react'
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

function renderHook(dataAdapter: ReturnType<typeof adapter>) {
  let result: ReturnType<typeof useProgramAdministration>
  const Probe: React.FC = () => {
    result = useProgramAdministration({ dataAdapter } as any)
    return null
  }
  render(<Probe />)
  return () => result
}

describe('useProgramAdministration', () => {
  it('reads the hubs from the global setting, resolves each, and fetches the projects from them', async () => {
    const dataAdapter = adapter(`${HUB}; ${OTHER};`)
    const result = renderHook(dataAdapter)
    await waitFor(() =>
      expect(dataAdapter.fetchChildProjects).toHaveBeenCalledWith([resolved(HUB), resolved(OTHER)])
    )
    expect(dataAdapter.initializeHubWebs).toHaveBeenCalledWith([resolved(HUB), resolved(OTHER)])
    await waitFor(() => expect(result().childProjects).toEqual([ALFA]))
    expect(result().programHubs).toEqual([resolved(HUB), resolved(OTHER)])
  })

  it("falls back to the program's own hub when the setting is empty or disabled, so the administration is not empty", async () => {
    // A disabled setting is absent from the global settings: nothing was read, and the list and
    // the add dialog stayed empty, with no word of why.
    const dataAdapter = adapter(undefined)
    const result = renderHook(dataAdapter)
    await waitFor(() =>
      expect(dataAdapter.fetchChildProjects).toHaveBeenCalledWith([resolved(HUB)])
    )
    await waitFor(() => expect(result().childProjects).toEqual([ALFA]))
    expect(result().programHubs).toEqual([resolved(HUB)])
  })

  it('leaves the hubs unknown, and the list empty, when a hub cannot be resolved', async () => {
    const dataAdapter = adapter(OTHER)
    dataAdapter.portalDataService.resolveHubSiteFromUrl.mockImplementation(() =>
      Promise.reject(new Error('404'))
    )
    const result = renderHook(dataAdapter)
    await waitFor(() => expect(result().context.state.childProjects).toEqual([]))
    expect(dataAdapter.fetchChildProjects).not.toHaveBeenCalled()
    expect(result().programHubs).toBeUndefined()
  })
})
