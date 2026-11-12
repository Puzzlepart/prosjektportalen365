// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The fetch is the real one: it reads the list's fields through
// the data adapter's portal first, and `fields.read` stands in for that request.
const fields: { read: () => Promise<any[]> } = { read: () => Promise.resolve([]) }
jest.mock('../../../data', () => ({
  __esModule: true,
  default: { portalDataService: { getListFields: () => fields.read() }, sp: {} }
}))

import { render, waitFor } from '@testing-library/react'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { useDynamicListDataFetch } from './useDynamicListDataFetch'

/**
 * The dynamic list's data fetch when the list cannot be read: the list shows SharePoint's
 * message, and the failure is counted once, for the dynamic list web part, by its error code. A
 * fetch that answers after the list is gone is neither shown nor counted.
 */
const web = { lists: { getByTitle: () => ({}) } } as any

/** Renders the fetch hook for the list `listName`; `setState` receives the list's state. */
function fetchList(listName = 'Oppgaver') {
  const setState = jest.fn()
  const Probe: React.FC = () => {
    useDynamicListDataFetch(
      { listName, webAbsoluteUrl: 'https://contoso.sharepoint.com/sites/alfa' } as any,
      {} as any,
      setState,
      web
    )
    return null
  }
  const { unmount } = render(
    <TelemetryProvider component='DynamicListWebPart'>
      <Probe />
    </TelemetryProvider>
  )
  return { setState, unmount }
}

describe('useDynamicListDataFetch', () => {
  // The fetch and the hook both log the error they pass on; here that is only noise.
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    startTestTelemetry()
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => consoleError.mockRestore())

  it('shows why the list could not be read, and counts the failure by its status', async () => {
    fields.read = () =>
      Promise.reject(Object.assign(new Error('Listen Oppgaver finnes ikke'), { status: 404 }))
    const { setState } = fetchList()
    await waitFor(() =>
      expect(setState).toHaveBeenLastCalledWith({
        error: 'Listen Oppgaver finnes ikke',
        isLoading: false,
        isChangingView: false,
        isRefetching: false
      })
    )
    expect(countedTelemetry().errors).toEqual({ 'DynamicListWebPart not_found 404': 1 })
  })

  it('neither shows nor counts a failure that comes after the list is gone', async () => {
    let fail: (error: unknown) => void
    fields.read = () =>
      new Promise((_resolve, reject) => {
        fail = reject
      })
    const { setState, unmount } = fetchList()
    expect(setState).toHaveBeenLastCalledWith({ isLoading: true })
    unmount()
    fail(Object.assign(new Error('Ingen tilgang'), { status: 403 }))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(setState).toHaveBeenLastCalledWith({ isLoading: true })
    expect(countedTelemetry().errors).toEqual({})
  })

  it('reads nothing, and counts nothing, when no list is chosen', () => {
    fields.read = jest.fn(() => Promise.resolve([]))
    const { setState } = fetchList('')
    expect(setState).toHaveBeenLastCalledWith({
      data: { listItems: [], listColumns: [] },
      isLoading: false
    })
    expect(fields.read).not.toHaveBeenCalled()
    expect(countedTelemetry().errors).toEqual({})
  })
})
