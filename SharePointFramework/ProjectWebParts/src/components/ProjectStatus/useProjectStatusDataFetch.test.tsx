// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter answers the first call of the fetch with what
// `adapter.fail` holds.
const adapter: { fail: unknown } = { fail: undefined }
jest.mock('../../data', () => ({
  __esModule: true,
  default: {
    isConfigured: true,
    portalDataService: { isAvailable: true },
    project: { getProjectInformationData: () => Promise.reject(adapter.fail) }
  }
}))

import { render, waitFor } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { useProjectStatusDataFetch } from './useProjectStatusDataFetch'

/**
 * What the status page tells the user when its data cannot be fetched: that access to the hub is
 * missing when SharePoint says so (401/403), and that the reports could not be loaded otherwise.
 */
async function errorMessageFor(failure: unknown) {
  adapter.fail = failure
  const dispatch = jest.fn()
  const Probe: React.FC = () => {
    useProjectStatusDataFetch({ siteId: 'site-1' } as any, 1, undefined, dispatch)
    return null
  }
  // The fetch logs the original error for diagnosis; the test does not need it in its output.
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  render(<Probe />)
  await waitFor(() => expect(dispatch).toHaveBeenCalled())
  consoleError.mockRestore()
  const [action] = dispatch.mock.calls[0]
  expect(action.type).toBe('FETCH_DATA_ERROR')
  return action.payload.error.message as string
}

describe('useProjectStatusDataFetch', () => {
  it('says that the reports could not be loaded when the request fails', async () => {
    expect(await errorMessageFor(new TypeError('Failed to fetch'))).toBe(
      strings.ProjectStatusDataErrorText
    )
  })

  it('says that access to the hub is missing when SharePoint answers 403', async () => {
    expect(await errorMessageFor({ status: 403, message: 'Forbidden' })).toBe(
      strings.ProjectStatusNoHubAccessErrorText
    )
  })
})
