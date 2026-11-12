// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The portal data service reaches SharePoint; `service` stands in.
const service = { deleteStatusReport: jest.fn() }
jest.mock('pp365-shared-library/lib/services', () => ({
  PortalDataService: function PortalDataService() {
    return { configure: () => Promise.resolve(service) }
  }
}))

import { render } from '@testing-library/react'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { ProjectStatusContext } from '../context'
import { CLEAR_USER_MESSAGE, REPORT_DELETED, REPORT_DELETE_ERROR } from '../reducer'
import { useDeleteReport } from './useDeleteReport'

/**
 * Deleting the selected status report: what the page is told when SharePoint deletes it, and when
 * the delete fails. A deleted report is counted once, for the status web part, and a failed delete
 * once as an error, by its code.
 */
function deleteReport() {
  const dispatch = jest.fn()
  let run: () => Promise<void>
  /** Exposes the selected report's deletion callback. */
  const Probe: React.FC = () => {
    run = useDeleteReport()
    return null
  }
  render(
    <TelemetryProvider component='ProjectStatusWebPart'>
      <ProjectStatusContext.Provider
        value={
          { props: { spfxContext: {} }, state: { selectedReport: { id: 3 } }, dispatch } as any
        }
      >
        <Probe />
      </ProjectStatusContext.Provider>
    </TelemetryProvider>
  )
  return { run, dispatch }
}

describe('useDeleteReport', () => {
  beforeEach(() => startTestTelemetry())

  afterEach(() => {
    jest.useRealTimers()
    service.deleteStatusReport.mockReset()
  })

  it('deletes the selected report and tells the page', async () => {
    service.deleteStatusReport.mockResolvedValueOnce(undefined)
    const { run, dispatch } = deleteReport()
    await run()
    expect(service.deleteStatusReport).toHaveBeenCalledWith(3)
    expect(dispatch.mock.calls).toEqual([[REPORT_DELETED()]])
    expect(countedTelemetry().usage).toEqual({ 'ProjectStatusWebPart statusReport.deleted': 1 })
    expect(countedTelemetry().errors).toEqual({})
  })

  it('passes on why a delete failed, counts the error once, and clears the message after a while', async () => {
    const error = Object.assign(new Error('Ingen tilgang'), { status: 403 })
    service.deleteStatusReport.mockRejectedValueOnce(error)
    const { run, dispatch } = deleteReport()
    jest.useFakeTimers()
    await run()
    expect(dispatch.mock.calls).toEqual([[REPORT_DELETE_ERROR({ error })]])
    expect(dispatch.mock.calls[0][0].payload.error).toBe(error)
    expect(countedTelemetry().usage).toEqual({})
    expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart permission_denied 403': 1 })
    jest.advanceTimersByTime(8000)
    expect(dispatch).toHaveBeenLastCalledWith(CLEAR_USER_MESSAGE())
  })
})
