// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The fetch and its read of the project's row in the hub are the
// real ones; the hub answers as `hub` says, and the timeline's configuration and content are
// stand-ins.
const hub = {
  isAvailable: true,
  configurationError: null as unknown,
  projectError: null as unknown
}
jest.mock('data/SPDataAdapter', () => ({
  __esModule: true,
  default: {
    get portalDataService() {
      const readProject = () =>
        hub.projectError
          ? Promise.reject(hub.projectError)
          : Promise.resolve([{ Id: 1, GtStartDate: '2026-01-05', GtEndDate: '2026-12-18' }])
      const items = { select: () => ({ filter: () => ({ top: () => readProject }) }) }
      return { isAvailable: hub.isAvailable, web: { lists: { getByTitle: () => ({ items }) } } }
    },
    project: {
      getProjectInformationData: () => Promise.resolve({ templateParameters: {} })
    }
  }
}))
jest.mock('./fetchTimelineConfiguration', () => ({
  fetchTimelineConfiguration: () =>
    hub.configurationError ? Promise.reject(hub.configurationError) : Promise.resolve([])
}))
jest.mock('./fetchTimelineData', () => ({ fetchTimelineData: () => Promise.resolve(null) }))

import { render, waitFor } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry,
  telemetryStore
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import resource from 'SharedResources'
import { useProjectTimelineDataFetch } from './useProjectTimelineDataFetch'

/**
 * The project timeline's data fetch: the timeline gets the project as an item in its group, or
 * the error to show when the fetch fails. The failure is counted once, for the timeline web part,
 * by the code of the error SharePoint gave. The error shown is made from that one, and keeps it
 * as its cause.
 */
const PROPS = { siteId: 'site-1', webTitle: 'Frisbeegolfbane' } as any

/** Renders the fetch hook and gives what it handed the timeline. */
async function fetchTimeline() {
  const fetchCallback = jest.fn()
  const Probe: React.FC = () => {
    useProjectTimelineDataFetch(PROPS, 1, fetchCallback)
    return null
  }
  render(
    <TelemetryProvider component='ProjectTimelineWebPart'>
      <Probe />
    </TelemetryProvider>
  )
  await waitFor(() => expect(fetchCallback).toHaveBeenCalled())
  expect(fetchCallback).toHaveBeenCalledTimes(1)
  return fetchCallback.mock.calls[0][0]
}

describe('useProjectTimelineDataFetch', () => {
  beforeEach(() => {
    hub.isAvailable = true
    hub.configurationError = null
    hub.projectError = null
    startTestTelemetry()
    // The fetch logs the error it shows; here that is only noise.
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => jest.restoreAllMocks())

  it('gives the timeline the project between its dates, in its own group, and counts no error', async () => {
    const { error, data, groups } = await fetchTimeline()
    expect(error).toBeUndefined()
    expect(data.projectId).toBe(1)
    expect(groups.projectGroups).toMatchObject([{ id: 0, title: 'Frisbeegolfbane' }])
    expect(data.groups).toEqual(groups.projectGroups)
    expect(data.items).toHaveLength(1)
    expect(data.items[0]).toMatchObject({
      group: 0,
      title: format(strings.ProjectTimelineItemInfo, 'Frisbeegolfbane'),
      data: { project: 'Frisbeegolfbane', type: resource.TimelineConfiguration_Project_Title }
    })
    expect(data.items[0].end_time.toDate().toISOString()).toBe('2026-12-18T00:00:00.000Z')
    expect(countedTelemetry().errors).toEqual({})
  })

  it("says the project's row could not be read, and counts the failure by its status", async () => {
    hub.projectError = Object.assign(
      new Error('Error making HttpClient request in queryable [503] ::> Prosjekter'),
      { status: 503 }
    )
    const { error, data } = await fetchTimeline()
    expect(data).toBeUndefined()
    expect(error.message).toBe(
      format(strings.ProjectTimelineErrorFetchText, 'site-1', 'Frisbeegolfbane', hub.projectError)
    )
    expect(error.type).toBe('warning')
    expect(countedTelemetry().errors).toEqual({ 'ProjectTimelineWebPart server_error 503': 1 })
    expect(JSON.stringify(telemetryStore())).not.toContain('Prosjekter')
  })

  it('says access is missing when a hub list is denied, and counts it as denied permission', async () => {
    hub.configurationError = Object.assign(new Error('403 FORBIDDEN'), { status: 403 })
    const { error } = await fetchTimeline()
    expect(error.message).toBe(strings.ProjectTimelineNoHubAccessErrorText)
    expect(countedTelemetry().errors).toEqual({
      'ProjectTimelineWebPart permission_denied 403': 1
    })
  })

  it('counts a hub that is out of reach without a status: no request was refused here', async () => {
    hub.isAvailable = false
    const { error } = await fetchTimeline()
    expect(error.message).toBe(strings.ProjectTimelineNoHubAccessErrorText)
    expect(countedTelemetry().errors).toEqual({ 'ProjectTimelineWebPart unknown': 1 })
  })
})
