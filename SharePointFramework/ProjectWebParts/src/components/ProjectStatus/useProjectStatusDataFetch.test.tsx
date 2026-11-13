// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter answers the first call of the fetch with what
// `adapter.fail` holds, or reads the project when it holds nothing, and its hub is `adapter.hub`.
const adapter: { fail: unknown; hub: { isAvailable: boolean; unavailableStatus?: number } } = {
  fail: undefined,
  hub: { isAvailable: true }
}
jest.mock('../../data', () => ({
  __esModule: true,
  default: {
    isConfigured: true,
    get portalDataService() {
      return adapter.hub
    },
    project: {
      getProjectInformationData: () =>
        adapter.fail === undefined ? Promise.resolve({}) : Promise.reject(adapter.fail)
    }
  }
}))

import { render, waitFor } from '@testing-library/react'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry,
  telemetryStore
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { useProjectStatusDataFetch } from './useProjectStatusDataFetch'

/**
 * What the status page tells the user when its data cannot be fetched: that access to the hub is
 * missing when SharePoint says so (401/403), and that the reports could not be loaded otherwise.
 * The failure is counted once, for the status web part, by the code of the error SharePoint gave:
 * the page shows a generic text, and the fetch keeps the original error as that text's cause.
 */
async function errorMessageFor(failure: unknown) {
  adapter.fail = failure
  const dispatch = jest.fn()
  /** Runs the status fetch so the test can inspect its dispatched failure. */
  const Probe: React.FC = () => {
    useProjectStatusDataFetch({ siteId: 'site-1' } as any, 1, undefined, dispatch)
    return null
  }
  // The fetch logs the original error for diagnosis; the test does not need it in its output.
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  render(
    <TelemetryProvider component='ProjectStatusWebPart'>
      <Probe />
    </TelemetryProvider>
  )
  await waitFor(() => expect(dispatch).toHaveBeenCalled())
  consoleError.mockRestore()
  expect(dispatch).toHaveBeenCalledTimes(1)
  const [action] = dispatch.mock.calls[0]
  expect(action.type).toBe('FETCH_DATA_ERROR')
  return action.payload.error.message as string
}

describe('useProjectStatusDataFetch', () => {
  beforeEach(() => {
    adapter.hub = { isAvailable: true }
    startTestTelemetry()
  })

  it('says that the reports could not be loaded when the request fails', async () => {
    expect(await errorMessageFor(new TypeError('Failed to fetch'))).toBe(
      strings.ProjectStatusDataErrorText
    )
    // A request that never got an answer has no status to count it by.
    expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart unknown': 1 })
  })

  it('says that access to the hub is missing when SharePoint answers 403', async () => {
    expect(await errorMessageFor({ status: 403, message: 'Forbidden' })).toBe(
      strings.ProjectStatusNoHubAccessErrorText
    )
    expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart permission_denied 403': 1 })
  })

  it('says that access to the hub is missing when the hub is out of reach, and counts it by the status the hub refused with', async () => {
    // The hub's data service met the refusal when it was configured, and kept its status.
    adapter.hub = { isAvailable: false, unavailableStatus: 403 }
    expect(await errorMessageFor(undefined)).toBe(strings.ProjectStatusNoHubAccessErrorText)
    expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart permission_denied 403': 1 })
  })

  it('counts a hub that is out of reach without a status as unknown: nothing was refused', async () => {
    // The hub's URL was never found, so no request was refused with a status.
    adapter.hub = { isAvailable: false }
    expect(await errorMessageFor(undefined)).toBe(strings.ProjectStatusNoHubAccessErrorText)
    expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart unknown': 1 })
  })

  it('counts the failure by the status SharePoint answered with, not by the text it shows', async () => {
    const throttled = Object.assign(
      new Error('Error making HttpClient request in queryable [429] ::> Prosjektstatus'),
      { status: 429 }
    )
    expect(await errorMessageFor(throttled)).toBe(strings.ProjectStatusDataErrorText)
    expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart throttled 429': 1 })
    expect(countedTelemetry().usage).toEqual({})
    // Neither text is kept: only the code and the status are.
    const store = JSON.stringify(telemetryStore())
    expect(store).not.toContain('Prosjektstatus')
    expect(store).not.toContain(strings.ProjectStatusDataErrorText)
  })
})
