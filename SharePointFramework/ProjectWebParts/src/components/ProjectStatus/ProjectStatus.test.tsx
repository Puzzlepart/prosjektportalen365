// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch dispatches what `fetched.action()` returns; the
// data adapter, the edit panel and the project information block (both reach SharePoint) are
// stand-ins.
const fetched: { action: () => any } = { action: () => null }
jest.mock('./useProjectStatusDataFetch', () => ({
  useProjectStatusDataFetch: (_props: any, _refetch: number, _scope: string, dispatch: any) => {
    const { useEffect } = jest.requireActual('react')
    useEffect(() => {
      const action = fetched.action()
      if (action) dispatch(action)
    }, [])
  }
}))
jest.mock('../../data', () => ({
  __esModule: true,
  default: { isConfigured: true, portalDataService: { isAvailable: true, web: {} }, project: {} }
}))
jest.mock('./EditStatusPanel', () => ({ EditStatusPanel: () => null }))
jest.mock('../ProjectInformation', () => ({
  ProjectInformation: () => {
    const React = jest.requireActual('react')
    return React.createElement('div', null, 'Prosjektinformasjon (mock)')
  }
}))

import { render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import { formatDate } from 'pp365-shared-library/lib/util'
import * as React from 'react'
import { ProjectStatus } from './ProjectStatus'
import { FETCH_DATA_ERROR, INIT_DATA } from './reducer'
import { PROPERTIES_SECTION_CT, report, section } from './testFixtures'

/**
 * The status page as a whole: the header with the report's status, the toolbar with the report
 * commands and what the user's permission allows, the section tabs, the sections with their
 * values, and the empty and error states.
 */
const sections = [
  section(1, 'Overordnet status', 'GtOverallStatus'),
  section(2, 'Fremdrift', 'GtStatusTime'),
  section(3, 'Økonomi', 'GtStatusBudget'),
  section(4, 'Prosjektinformasjon', 'GtStatusProjectInfo', PROPERTIES_SECTION_CT, {
    GtSecViewFields: 'GtProjectOwner'
  })
]
const values = {
  GtOverallStatus: 'Prosjektet går etter planen.',
  GtStatusTime: 'Grønn',
  GtStatusTimeComment: 'Alle milepæler er nådd.',
  GtProjectOwner: 'Kari Nordmann'
}
const fields = [{ InternalName: 'GtProjectOwner', Title: 'Prosjekteier', TypeAsString: 'User' }]

function initData(selected: any, overrides: Record<string, any> = {}) {
  return INIT_DATA({
    data: {
      reports: selected ? [selected] : [],
      sections,
      columnConfig: [{ columnFieldName: 'GtStatusTime', value: 'Grønn', color: '#107c10' }],
      reportFields: [],
      properties: { fieldValues: { _fieldValues: {}, _fieldValuesAsText: {} }, fields },
      userHasAdminPermission: true,
      scopeKeysWithReports: [],
      ...overrides
    } as any,
    initialSelectedReport: selected,
    sourceUrl: '',
    resolvedScope: ''
  })
}

function renderStatus(action: () => any, props: Record<string, any> = {}) {
  fetched.action = action
  render(
    <ProjectStatus
      title='Prosjektstatus'
      siteId='site-1'
      webAbsoluteUrl='https://contoso.sharepoint.com/sites/alfa'
      spfxContext={{ pageContext: { web: { absoluteUrl: '' } } } as any}
      {...props}
    />
  )
}

describe('ProjectStatus', () => {
  it('shows the report: its status in the header, the commands, the tabs and the sections', async () => {
    const published = report(values)
    renderStatus(() => initData(published))
    expect(
      await screen.findByText(strings.ProjectInformationStatusReportHeaderText, {
        selector: 'span'
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(format(strings.PublishedStatusReport, formatDate(published.publishedDate)), {
        selector: 'span'
      })
    ).toBeInTheDocument()
    // Commands: a published report can be followed by a new one, but not edited, published or deleted.
    expect(screen.getByRole('button', { name: strings.NewStatusReportLabel })).toBeEnabled()
    expect(screen.getByRole('button', { name: strings.EditReportButtonLabel })).toBeDisabled()
    expect(screen.getByRole('button', { name: strings.PublishReportButtonLabel })).toBeDisabled()
    expect(screen.getByRole('button', { name: strings.DeleteReportButtonLabel })).toBeDisabled()
    // One tab per section with content; "Økonomi" has no value and is left out.
    for (const name of ['Overordnet status', 'Fremdrift', 'Prosjektinformasjon']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    expect(screen.queryByRole('tab', { name: 'Økonomi' })).toBeNull()
    // Once in the summary's status elements, once in the section itself.
    expect(screen.getAllByText('Grønn')).toHaveLength(2)
    expect(screen.getAllByText('Alle milepæler er nådd.')).toHaveLength(2)
    expect(screen.getByText('Prosjekteier')).toBeInTheDocument()
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument()
    // The summary shows the project information beside the status.
    expect(screen.getByText('Prosjektinformasjon (mock)')).toBeInTheDocument()
  })

  it('lets an admin edit, publish and delete a draft, and not create another', async () => {
    const draft = report(values, { published: false })
    renderStatus(() => initData(draft))
    expect(await screen.findByRole('button', { name: strings.EditReportButtonLabel })).toBeEnabled()
    expect(screen.getByRole('button', { name: strings.PublishReportButtonLabel })).toBeEnabled()
    expect(screen.getByRole('button', { name: strings.DeleteReportButtonLabel })).toBeEnabled()
    expect(screen.getByRole('button', { name: strings.NewStatusReportLabel })).toBeDisabled()
    expect(
      screen.getByText(format(strings.NotPublishedStatusReport, formatDate(draft.modified)), {
        selector: 'span'
      })
    ).toBeInTheDocument()
  })

  it('offers no report commands to a user without the admin permission', async () => {
    renderStatus(() => initData(report(values), { userHasAdminPermission: false }))
    expect(await screen.findByRole('button', { name: strings.NewStatusReportLabel })).toBeDisabled()
    expect(screen.getByRole('button', { name: strings.EditReportButtonLabel })).toBeDisabled()
  })

  it('offers the scope selector only with multi-reporting', async () => {
    renderStatus(() => initData(report(values)), {
      multiReporting: true,
      subProjects: 'DP1|Delprosjekt 1'
    })
    expect(
      await screen.findByRole('button', { name: strings.DefaultScopeLabel })
    ).toBeInTheDocument()
  })

  it('has no scope selector by default', async () => {
    renderStatus(() => initData(report(values)))
    await screen.findByRole('button', { name: strings.NewStatusReportLabel })
    expect(screen.queryByRole('button', { name: strings.DefaultScopeLabel })).toBeNull()
  })

  it('tells when the project has no report yet', async () => {
    renderStatus(() => initData(undefined))
    expect(
      await screen.findByText(strings.NoReportsFoundTitle, {
        selector: '[class*="MessageBarTitle"]'
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.NewStatusReportLabel })).toBeEnabled()
  })

  it('shows the error when the data cannot be fetched', async () => {
    renderStatus(() => FETCH_DATA_ERROR({ error: { message: 'Kilden svarte ikke' } as any }))
    expect(await screen.findByText(strings.ErrorTitle)).toBeInTheDocument()
    expect(screen.getByText('Kilden svarte ikke')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: strings.NewStatusReportLabel })).toBeNull()
  })
})
