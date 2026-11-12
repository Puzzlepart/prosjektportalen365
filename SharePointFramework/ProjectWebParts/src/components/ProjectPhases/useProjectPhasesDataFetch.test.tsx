// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter reads the phase field, the phases, the project
// and what can be archived; the phase field fails with what `adapter.fail` holds.
const adapter: { fail: unknown } = { fail: undefined }
jest.mock('../../data', () => ({
  __esModule: true,
  default: {
    isConfigured: true,
    getTermFieldContext: (fieldName: string) =>
      adapter.fail
        ? Promise.reject(adapter.fail)
        : Promise.resolve({ fieldName, termSetId: `terms-${fieldName}`, textField: 'TaxText' }),
    checkProjectAdminPermissions: () => Promise.resolve(true),
    getDocumentsForArchive: () =>
      Promise.resolve([
        { id: 1, title: 'Prosjektmandat.docx', documentTypeId: 'mandat' },
        { id: 2, title: 'Notat.docx', documentTypeId: 'notat' }
      ]),
    getListsForArchive: () =>
      Promise.resolve([
        { title: 'Usikkerhet', itemCount: 4 },
        { title: 'Endringsanalyse', itemCount: 0 }
      ]),
    getArchiveStatus: () => Promise.resolve({ lastArchiveDate: '2026-11-01' }),
    project: {
      getChecklistData: () => Promise.resolve({}),
      getWelcomePage: () => Promise.resolve('SitePages/Home.aspx'),
      getProjectInformationData: () => Promise.resolve({ fieldValues: {} }),
      getPhases: () => Promise.resolve([{ name: 'Konsept' }, { name: 'Planlegge' }]),
      getCurrentPhaseName: () => Promise.resolve('Planlegge'),
      getDocumentTypes: () =>
        Promise.resolve([
          { id: 'mandat', isArchiveable: true },
          { id: 'notat', isArchiveable: false }
        ])
    }
  }
}))
jest.mock('./index', () => ({ ProjectPhases: { displayName: 'Project Phases' } }))
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
import { INIT_DATA } from './reducer'
import { useProjectPhasesDataFetch } from './useProjectPhasesDataFetch'

/** The site's pages: one for a phase, and one that is no phase's. */
const sitePages = {
  getList: () => ({
    items: {
      select: () => () =>
        Promise.resolve([
          { Id: 3, Title: 'Planlegge', FileLeafRef: 'Planlegge.aspx' },
          { Id: 4, Title: 'Om prosjektet', FileLeafRef: 'Om.aspx' }
        ])
    }
  })
}

/**
 * The phases' data fetch: the web part gets the phases and the current one, with the phases' pages
 * and what can be archived when it is set to use them, or the generic text when the fetch fails.
 * The failure is counted once, for the phases web part, by the code of the error SharePoint gave,
 * which the generic text keeps as its cause.
 *
 * @param props The web part's properties, over a site without phase pages and archiving
 */
async function fetchPhases(props: Record<string, any> = {}) {
  const dispatch = jest.fn()
  const Probe: React.FC = () => {
    useProjectPhasesDataFetch({ siteId: 'site-1', ...props } as any, dispatch)
    return null
  }
  render(
    <TelemetryProvider component='ProjectPhasesWebPart'>
      <Probe />
    </TelemetryProvider>
  )
  await waitFor(() => expect(dispatch).toHaveBeenCalled())
  expect(dispatch).toHaveBeenCalledTimes(1)
  const [action] = dispatch.mock.calls[0]
  expect(action.type).toBe(INIT_DATA.type)
  return action.payload
}

describe('useProjectPhasesDataFetch', () => {
  beforeEach(() => {
    adapter.fail = undefined
    startTestTelemetry()
  })

  it('gives the web part the phases and the current one, and counts no error', async () => {
    const { data, error } = await fetchPhases()
    expect(data.phases.map(({ name }) => name)).toEqual(['Konsept', 'Planlegge'])
    expect(data.currentPhase).toEqual({ name: 'Planlegge' })
    expect(data.phaseField.fieldName).toBe('GtProjectPhase')
    expect(data.userHasChangePhasePermission).toBe(true)
    expect(data.phaseSitePages).toEqual([])
    expect(data).not.toHaveProperty('archiveDocuments')
    expect(error).toBeUndefined()
    expect(countedTelemetry().errors).toEqual({})
  })

  it("reads the phases' pages and what can be archived when the web part uses them", async () => {
    const { data } = await fetchPhases({
      useDynamicHomepage: true,
      useArchive: true,
      webAbsoluteUrl: 'https://contoso.sharepoint.com/sites/frisbee',
      sp: { web: sitePages },
      pageContext: { web: { serverRelativeUrl: '/sites/frisbee' } }
    })
    // Only a page named after a phase is a phase's page.
    expect(data.phaseSitePages).toEqual([
      { id: 3, title: 'Planlegge', fileLeafRef: 'Planlegge.aspx' }
    ])
    // A document can be chosen when its type can be archived, and a list when it has items.
    expect(data.documentTypes).toEqual([{ id: 'mandat', isArchiveable: true }])
    expect(data.archiveDocuments).toMatchObject([
      { id: 1, selected: false, disabled: false },
      { id: 2, selected: false, disabled: true }
    ])
    expect(data.archiveLists).toMatchObject([
      { title: 'Usikkerhet', selected: false, disabled: false },
      { title: 'Endringsanalyse', selected: false, disabled: true }
    ])
    expect(data.archiveStatus).toEqual({ lastArchiveDate: '2026-11-01' })
    expect(countedTelemetry().errors).toEqual({})
  })

  it('shows the generic text when the fetch fails, and counts the failure by its status', async () => {
    adapter.fail = Object.assign(
      new Error('Error making HttpClient request in queryable [404] ::> GtProjectPhase'),
      { status: 404 }
    )
    const { data, error } = await fetchPhases()
    expect(data).toBeNull()
    expect(error.message).toBe(strings.ProjectPhasesFetchDataError)
    expect(countedTelemetry().errors).toEqual({ 'ProjectPhasesWebPart not_found 404': 1 })
    expect(JSON.stringify(telemetryStore())).not.toContain('GtProjectPhase')
  })

  it('counts a refused request as denied permission', async () => {
    adapter.fail = { status: 403, message: 'Forbidden' }
    const { error } = await fetchPhases()
    expect(error.message).toBe(strings.ProjectPhasesFetchDataError)
    expect(countedTelemetry().errors).toEqual({ 'ProjectPhasesWebPart permission_denied 403': 1 })
  })
})
