// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The hook reads DEBUG, which SPFx defines at build. The data
// adapter reads the project and the hub: `hub.isAvailable` says whether the hub is in reach, and
// its project columns fail with what `hub.fail` holds.
;(globalThis as any).DEBUG = false
const hub: { isAvailable: boolean; fail: unknown } = { isAvailable: true, fail: undefined }
const adapter = {
  configure: () => Promise.resolve(),
  project: {
    getProjectInformationData: () =>
      Promise.resolve({
        fieldValues: { get: () => 'Standardmal' },
        fields: [],
        propertiesListId: 'list-1',
        templateParameters: {}
      })
  },
  get portalDataService() {
    return {
      isAvailable: hub.isAvailable,
      getProjectColumns: () => (hub.fail ? Promise.reject(hub.fail) : Promise.resolve([])),
      getProjectTemplate: (name: string) => Promise.resolve({ name }),
      getParentProjects: () => Promise.resolve([{ title: 'Idrettsanlegg' }]),
      getChildProjects: () => Promise.resolve([])
    }
  },
  getArchiveStatus: () => Promise.resolve({ lastArchiveDate: '2026-11-01' }),
  checkProjectAdminPermissions: jest.fn((_permission: unknown, _fieldValues: unknown) =>
    Promise.resolve(true)
  ),
  sp: { web: { currentUserHasPermissions: jest.fn(() => Promise.resolve(true)) } }
}
jest.mock('../../../data', () => ({ __esModule: true, default: adapter }))
jest.mock('../index', () => ({ ProjectInformation: { displayName: 'Project Information' } }))
jest.mock('pp365-shared-library/lib/logging', () => ({
  ListLogger: { log: jest.fn(() => Promise.resolve()) }
}))

import { render, waitFor } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry,
  telemetryStore
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { FETCH_DATA_ERROR, INIT_DATA } from '../reducer'
import { useProjectInformationDataFetch } from './useProjectInformationDataFetch'

/**
 * The project information's data fetch: the web part gets its data, with what the user may do on
 * the front page, or the generic text when the fetch fails. The failure is counted once, for the
 * web part the component is in, by the code of the error SharePoint gave, which the generic text
 * keeps as its cause.
 *
 * @param page The page the web part is on (`Frontpage` reads the hub for more)
 */
async function fetchInformation(page = 'ProjectPage') {
  const dispatch = jest.fn()
  const context = {
    props: {
      page,
      hideStatusReport: true,
      siteId: 'site-1',
      webAbsoluteUrl: 'https://contoso.sharepoint.com/sites/frisbee',
      spfxContext: {}
    },
    state: {},
    dispatch
  } as any
  const Probe: React.FC = () => {
    useProjectInformationDataFetch(context)
    return null
  }
  render(
    <TelemetryProvider component='ProjectInformationWebPart'>
      <Probe />
    </TelemetryProvider>
  )
  await waitFor(() => expect(dispatch).toHaveBeenCalled())
  expect(dispatch).toHaveBeenCalledTimes(1)
  return dispatch.mock.calls[0][0]
}

describe('useProjectInformationDataFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    hub.isAvailable = true
    hub.fail = undefined
    startTestTelemetry()
  })

  it('gives the web part its data, and counts no error', async () => {
    const action = await fetchInformation()
    expect(action.type).toBe(INIT_DATA.type)
    expect(action.payload.state).toMatchObject({
      hubIsAvailable: true,
      userHasEditPermission: false,
      userHasRerunSetupPermission: false,
      data: { columns: [], parentProjects: [], template: { name: 'Standardmal' } }
    })
    // Only the front page asks what the user may do, and for the projects around this one.
    expect(adapter.checkProjectAdminPermissions).not.toHaveBeenCalled()
    expect(countedTelemetry().errors).toEqual({})
  })

  it('reads the projects around this one and what the user may do, on the front page', async () => {
    const action = await fetchInformation('Frontpage')
    expect(action.payload.state).toMatchObject({
      hubIsAvailable: true,
      userHasEditPermission: true,
      userHasRerunSetupPermission: true,
      data: {
        parentProjects: [{ title: 'Idrettsanlegg' }],
        childProjects: [],
        archiveStatus: { lastArchiveDate: '2026-11-01' }
      }
    })
    expect(adapter.checkProjectAdminPermissions).toHaveBeenCalledTimes(2)
    expect(countedTelemetry().errors).toEqual({})
  })

  it("takes the site's own permissions when the hub is out of reach, which is no error", async () => {
    hub.isAvailable = false
    const action = await fetchInformation('Frontpage')
    expect(action.type).toBe(INIT_DATA.type)
    expect(action.payload.state).toMatchObject({
      hubIsAvailable: false,
      userHasEditPermission: true,
      userHasRerunSetupPermission: true,
      data: { columns: [], parentProjects: [], childProjects: [], template: null }
    })
    expect(adapter.sp.web.currentUserHasPermissions).toHaveBeenCalledTimes(1)
    expect(adapter.checkProjectAdminPermissions).not.toHaveBeenCalled()
    expect(countedTelemetry().errors).toEqual({})
  })

  it('shows the generic text when the fetch fails, and counts the failure by its status', async () => {
    hub.fail = Object.assign(
      new Error('Error making HttpClient request in queryable [503] ::> Prosjektkolonner'),
      { status: 503 }
    )
    const action = await fetchInformation()
    expect(action.type).toBe(FETCH_DATA_ERROR.type)
    expect(action.payload.error.message).toBe(strings.ProjectInformationDataFetchErrorText)
    expect(action.payload.error.type).toBe('error')
    expect(countedTelemetry().errors).toEqual({ 'ProjectInformationWebPart server_error 503': 1 })
    expect(JSON.stringify(telemetryStore())).not.toContain('Prosjektkolonner')
  })

  it('counts a failure without a status as unknown', async () => {
    hub.fail = new TypeError('Failed to fetch')
    const action = await fetchInformation()
    expect(action.payload.error.message).toBe(strings.ProjectInformationDataFetchErrorText)
    expect(countedTelemetry().errors).toEqual({ 'ProjectInformationWebPart unknown': 1 })
  })
})
