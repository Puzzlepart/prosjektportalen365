// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The portal data service reaches SharePoint; `service` stands in.
// The snapshot is drawn from the page (tested by itself); here it is the text `bilde`.
const service = { publishStatusReport: jest.fn() }
jest.mock('pp365-shared-library/lib/services', () => ({
  PortalDataService: function PortalDataService() {
    return { configure: () => Promise.resolve(service) }
  }
}))
const captureReportSnapshot = jest.fn((_title: string) => Promise.resolve('bilde'))
jest.mock('./useCaptureReportSnapshot', () => ({
  useCaptureReportSnapshot: () => captureReportSnapshot
}))

import { render } from '@testing-library/react'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import resource from 'SharedResources'
import { ProjectStatusContext } from '../context'
import {
  CLEAR_USER_MESSAGE,
  REPORT_PUBLISHED,
  REPORT_PUBLISHING,
  REPORT_PUBLISH_ERROR,
  SELECT_REPORT
} from '../reducer'
import { usePublishReport } from './usePublishReport'

/**
 * Publishing the selected status report: its snapshot and section data go with it, the page is
 * told, and a published report is counted once, for the status web part. A failed publish tells
 * why, counts no usage, and is counted once as an error, by its code.
 */
const DRAFT = { id: 3 } as any
const PUBLISHED = { id: 3, published: true } as any

function publishReport(state: Record<string, any> = {}) {
  const dispatch = jest.fn()
  let run: () => Promise<void>
  const Probe: React.FC = () => {
    run = usePublishReport()
    return null
  }
  render(
    <TelemetryProvider component='ProjectStatusWebPart'>
      <ProjectStatusContext.Provider
        value={
          {
            props: {
              spfxContext: {},
              webTitle: 'Frisbeegolfbane',
              subProjects: 'bane|Banen',
              snapshotAttachmentFileName: 'snapshot.png',
              persistSectionDataAttachmentFileName: 'data.json'
            },
            state: {
              selectedReport: DRAFT,
              persistedSectionData: { budsjett: 'I rute' },
              isPublishing: false,
              ...state
            },
            dispatch
          } as any
        }
      >
        <Probe />
      </ProjectStatusContext.Provider>
    </TelemetryProvider>
  )
  return { run, dispatch }
}

describe('usePublishReport', () => {
  beforeEach(() => {
    startTestTelemetry()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('publishes the selected report with its snapshot and section data, tells the page and counts it once', async () => {
    service.publishStatusReport.mockResolvedValueOnce(PUBLISHED)
    const { run, dispatch } = publishReport()
    await run()
    expect(captureReportSnapshot).toHaveBeenCalledWith('Frisbeegolfbane')
    expect(service.publishStatusReport).toHaveBeenCalledWith(
      DRAFT,
      expect.any(String),
      [
        { url: 'snapshot.png', content: 'bilde' },
        { url: 'data.json', content: JSON.stringify({ budsjett: 'I rute' }) }
      ],
      resource.Choice_GtModerationStatus_Published
    )
    expect(dispatch.mock.calls).toEqual([
      [REPORT_PUBLISHING()],
      [REPORT_PUBLISHED({ updatedReport: PUBLISHED, message: null })],
      [SELECT_REPORT({ report: PUBLISHED })]
    ])
    expect(countedTelemetry().usage).toEqual({ 'ProjectStatusWebPart statusReport.published': 1 })
    expect(countedTelemetry().errors).toEqual({})
    jest.advanceTimersByTime(8000)
    expect(dispatch).toHaveBeenLastCalledWith(CLEAR_USER_MESSAGE())
  })

  it('names the snapshot of a sub-project by its label', async () => {
    service.publishStatusReport.mockResolvedValueOnce(PUBLISHED)
    const { run } = publishReport({ selectedScope: 'bane' })
    await run()
    expect(captureReportSnapshot).toHaveBeenCalledWith('Frisbeegolfbane – Banen')
  })

  it('tells why a publish failed, and counts the error once, by its code', async () => {
    service.publishStatusReport.mockRejectedValueOnce(
      Object.assign(new Error('Ingen tilgang'), { status: 403 })
    )
    const { run, dispatch } = publishReport()
    await run()
    expect(dispatch.mock.calls).toEqual([
      [REPORT_PUBLISHING()],
      [REPORT_PUBLISH_ERROR({ message: { text: 'Ingen tilgang', intent: 'error' } })]
    ])
    expect(countedTelemetry().usage).toEqual({})
    expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart permission_denied 403': 1 })
    jest.advanceTimersByTime(8000)
    expect(dispatch).toHaveBeenLastCalledWith(CLEAR_USER_MESSAGE())
  })

  it('does nothing while a publish is under way', async () => {
    const { run, dispatch } = publishReport({ isPublishing: true })
    await run()
    expect(service.publishStatusReport).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry().usage).toEqual({})
  })
})
