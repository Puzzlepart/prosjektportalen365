import { render, waitFor } from '@testing-library/react'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { useProjectListDataFetch } from './useProjectListDataFetch'

/**
 * Render the fetch hook with an adapter stand-in and record partial state updates.
 */
function fetchWith(dataAdapter: Record<string, any>) {
  const setState = jest.fn()
  /** Run the fetch effect with the supplied adapter and state-update recorder. */
  const Probe: React.FC = () => {
    useProjectListDataFetch({ dataAdapter } as any, setState)
    return null
  }
  render(
    <TelemetryProvider component='ProjectListWebPart'>
      <Probe />
    </TelemetryProvider>
  )
  return setState
}

beforeEach(() => startTestTelemetry())

describe('useProjectListDataFetch', () => {
  it('hands over the projects and the membership, and counts nothing', async () => {
    const setState = fetchWith({
      fetchEnrichedProjects: () => Promise.resolve([{ title: 'Alfa' }]),
      isUserInGroup: () => Promise.resolve(true)
    })
    await waitFor(() => expect(setState).toHaveBeenCalled())
    expect(setState).toHaveBeenCalledWith({
      projects: [{ title: 'Alfa' }],
      isDataLoaded: true,
      isUserInPortfolioManagerGroup: true
    })
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
  })

  it('hands over the error, with no projects, when the fetch fails, and counts it once by its code', async () => {
    const setState = fetchWith({
      fetchEnrichedProjects: () =>
        Promise.reject(Object.assign(new Error('Søket svarte ikke'), { status: 429 })),
      isUserInGroup: () => Promise.resolve(false)
    })
    await waitFor(() => expect(setState).toHaveBeenCalled())
    expect(setState).toHaveBeenCalledWith({
      projects: [],
      isDataLoaded: true,
      error: 'Søket svarte ikke'
    })
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: { 'ProjectListWebPart throttled 429': 1 },
      timings: {}
    })
    expect(JSON.stringify(countedTelemetry())).not.toContain('Søket')
  })
})
