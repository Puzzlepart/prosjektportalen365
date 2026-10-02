// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch dispatches what `fetched.action()` returns; the
// data adapter and the panels and dialogs (all reach SharePoint) are stand-ins.
const fetched: { action: () => any } = { action: () => null }
jest.mock('./data', () => ({
  useProjectInformationDataFetch: (context: any) => {
    const { useEffect } = jest.requireActual('react')
    useEffect(() => {
      const action = fetched.action()
      if (action) context.dispatch(action)
    }, [])
  }
}))
jest.mock('../../data', () => ({
  __esModule: true,
  default: { isConfigured: false, portalDataService: { isAvailable: true } }
}))
jest.mock('./AllPropertiesPanel', () => ({ AllPropertiesPanel: () => null }))
jest.mock('./EditPropertiesPanel', () => ({ EditPropertiesPanel: () => null }))
jest.mock('./CreateParentDialog', () => ({ CreateParentDialog: () => null }))
jest.mock('./RunProjectSetupDialog', () => ({ RunProjectSetupDialog: () => null }))
jest.mock('./ProgressDialog', () => ({ ProgressDialog: () => null }))
jest.mock('./ProjectStatusReport', () => ({ ProjectStatusReport: () => null }))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { ProjectInformation } from './ProjectInformation'
import { FETCH_DATA_ERROR, INIT_DATA } from './reducer'

/**
 * The project information web part as a whole: the loading state, the title, the properties (or
 * the message when there are none), the actions the user's permissions allow, the parent and
 * child projects, and the error state.
 */
const spfxContext = {
  pageContext: {
    cultureInfo: { currentUICultureName: 'nb-NO' },
    web: { absoluteUrl: 'https://contoso.sharepoint.com/sites/alfa' }
  }
} as any

function initData(overrides: Record<string, any> = {}, state: Record<string, any> = {}) {
  return INIT_DATA({
    state: {
      data: {
        fields: [],
        columns: [],
        fieldValues: { get: () => undefined },
        parentProjects: [],
        childProjects: [],
        reports: [],
        sections: [],
        columnConfig: [],
        template: null,
        archiveStatus: null,
        propertiesListId: null,
        templateParameters: {},
        ...overrides
      },
      hubIsAvailable: true,
      userHasEditPermission: true,
      userHasRerunSetupPermission: false,
      ...state
    } as any
  })
}

function renderInformation(action: () => any, props: Record<string, any> = {}) {
  fetched.action = action
  render(
    <ProjectInformation
      title='Prosjektinformasjon'
      page='Frontpage'
      siteId='site-1'
      webAbsoluteUrl='https://contoso.sharepoint.com/sites/alfa'
      webServerRelativeUrl='/sites/alfa'
      spfxContext={spfxContext}
      {...props}
    />
  )
}

const project = (title: string) => ({ title, url: `/sites/${title.toLowerCase()}` })

describe('ProjectInformation', () => {
  it('shows nothing but a skeleton until the data is there', () => {
    renderInformation(() => null)
    expect(screen.queryByText('Prosjektinformasjon', { selector: 'span' })).toBeNull()
  })

  it('shows the title, the properties message and the actions the permission allows', async () => {
    renderInformation(() => initData())
    expect(await screen.findByText('Prosjektinformasjon', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText(strings.NoPropertiesTitle)).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: format(strings.ShowAllProjectInformationText, 'prosjektinformasjon')
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: format(strings.EditProjectInformationText, 'prosjektinformasjon')
      })
    ).toBeInTheDocument()
    // Without the rerun permission, promoting to a parent project and rerunning the setup are hidden.
    expect(screen.queryByRole('button', { name: strings.CreateParentProjectLabel })).toBeNull()
    expect(screen.queryByRole('button', { name: strings.RunProjectSetupLabel })).toBeNull()
  })

  it('hides the editing actions from a user without the edit permission', async () => {
    renderInformation(() => initData({}, { userHasEditPermission: false }))
    await screen.findByText('Prosjektinformasjon', { selector: 'span' })
    expect(
      screen.queryByRole('button', {
        name: format(strings.EditProjectInformationText, 'prosjektinformasjon')
      })
    ).toBeNull()
    expect(screen.queryByRole('button', { name: strings.ViewVersionHistoryText })).toBeNull()
  })

  it('lists the parent projects and the child projects, the latter folded past the row limit', async () => {
    const user = userEvent.setup()
    renderInformation(
      () =>
        initData({
          parentProjects: [project('Program Nord')],
          childProjects: ['Alfa', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf'].map(
            project
          )
        }),
      { rowLimit: 6, minRowLimit: 4 }
    )
    expect(
      await screen.findByText(strings.ParentProjectsHeaderText, { selector: 'span' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Program Nord' })).toBeInTheDocument()
    expect(
      screen.getByText(strings.ChildProjectsHeaderText, { selector: 'span' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Foxtrot' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Golf' })).toBeNull()
    await user.click(screen.getByRole('button', { name: strings.ShowMoreChildProjectsText }))
    expect(screen.getByRole('button', { name: 'Golf' })).toBeInTheDocument()
  })

  it('shows the error when the data cannot be fetched', async () => {
    renderInformation(() => FETCH_DATA_ERROR({ error: { message: 'Kilden svarte ikke' } as any }))
    expect(await screen.findByText(strings.ErrorTitle)).toBeInTheDocument()
    expect(screen.getByText('Kilden svarte ikke')).toBeInTheDocument()
  })

  it('tells when the hub is out of reach', async () => {
    renderInformation(() => initData({}, { hubIsAvailable: false }))
    expect(
      await screen.findByText(strings.ProjectInformationNoHubAccessMessage)
    ).toBeInTheDocument()
  })
})
