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
jest.mock('./ProjectStatusReport', () => ({
  ProjectStatusReport: () => {
    const React = jest.requireActual('react')
    const { useProjectInformationContext } = jest.requireActual('./context')
    const context = useProjectInformationContext()
    return React.createElement(
      'span',
      { 'data-testid': 'status-report-props' },
      `iconsOnly:${context.props.statusReportShowOnlyIcons}`
    )
  }
}))
jest.mock('./SustainabilityGoals', () => ({
  SustainabilityGoals: () => {
    const React = jest.requireActual('react')
    const { useProjectInformationContext } = jest.requireActual('./context')
    const context = useProjectInformationContext()
    return React.createElement(
      'span',
      { 'data-testid': 'sustainability-props' },
      `${context.props.showSustainabilityGoalsAsIcons}:${context.props.sustainabilityGoalIconSize}`
    )
  }
}))

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeComponent } from 'pp365-jest-config/lib/axe'
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

function information(props: Record<string, any> = {}) {
  return (
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

function renderInformation(action: () => any, props: Record<string, any> = {}) {
  fetched.action = action
  return render(information(props))
}

const project = (title: string) => ({ title, url: `/sites/${title.toLowerCase()}` })

describe('ProjectInformation', () => {
  it('shows nothing but a skeleton until the data is there, named for a screen reader', () => {
    renderInformation(() => null)
    expect(screen.queryByText('Prosjektinformasjon', { selector: 'span' })).toBeNull()
    expect(
      screen.getByRole('progressbar', { name: format(strings.LoadingText, 'Prosjektinformasjon') })
    ).toBeInTheDocument()
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

  it('leaves its title to a host that shows it, and still names its actions after it', async () => {
    renderInformation(() => initData(), { hideTitle: true })
    expect(await screen.findByText(strings.NoPropertiesTitle)).toBeInTheDocument()
    expect(screen.queryByText('Prosjektinformasjon', { selector: 'span' })).toBeNull()
    expect(
      screen.getByRole('button', {
        name: format(strings.ShowAllProjectInformationText, 'prosjektinformasjon')
      })
    ).toBeInTheDocument()
  })

  it('updates sustainability properties in its context when web part properties change', async () => {
    const view = renderInformation(() => initData(), {
      showSustainabilityGoalsAsIcons: true,
      sustainabilityGoalIconSize: 32
    })
    expect(await screen.findByTestId('sustainability-props')).toHaveTextContent('true:32')

    view.rerender(
      information({ showSustainabilityGoalsAsIcons: false, sustainabilityGoalIconSize: 64 })
    )
    expect(screen.getByTestId('sustainability-props')).toHaveTextContent('false:64')
  })

  it('hides the editing actions from a user without the edit permission', async () => {
    renderInformation(() => initData({}, { userHasEditPermission: false }))
    await screen.findByText('Prosjektinformasjon', { selector: 'span' })
    expect(
      screen.queryByRole('button', {
        name: format(strings.EditProjectInformationText, 'prosjektinformasjon')
      })
    ).toBeNull()
    expect(screen.queryByRole('link', { name: strings.ViewVersionHistoryText })).toBeNull()
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
    expect(screen.getByRole('link', { name: 'Program Nord' })).toBeInTheDocument()
    expect(
      screen.getByText(strings.ChildProjectsHeaderText, { selector: 'span' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Foxtrot' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Golf' })).toBeNull()
    await user.click(screen.getByRole('button', { name: strings.ShowMoreChildProjectsText }))
    expect(screen.getByRole('link', { name: 'Golf' })).toBeInTheDocument()
  })

  it('links the parent and child projects in lists under section headings (WCAG 1.3.1, 4.1.2)', async () => {
    const { container } = renderInformation(() =>
      initData({ parentProjects: [project('Program Nord')], childProjects: [project('Alfa')] })
    )
    const parents = await screen.findByRole('heading', {
      level: 3,
      name: strings.ParentProjectsHeaderText
    })
    expect(parents).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: strings.ChildProjectsHeaderText })
    ).toBeInTheDocument()
    const [parentList, childList] = screen.getAllByRole('list')
    expect(within(parentList).getByRole('link', { name: 'Program Nord' })).toHaveAttribute(
      'href',
      '/sites/program nord'
    )
    expect(within(childList).getByRole('link', { name: 'Alfa' })).toHaveAttribute(
      'href',
      '/sites/alfa'
    )
    expect(await axeComponent(container)).toHaveNoViolations()
  })

  it('shows the error when the data cannot be fetched', async () => {
    renderInformation(() => FETCH_DATA_ERROR({ error: { message: 'Kilden svarte ikke' } as any }))
    expect(await screen.findByText(strings.ErrorTitle)).toBeInTheDocument()
    expect(screen.getByText('Kilden svarte ikke')).toBeInTheDocument()
  })

  it('shows the status report in full by default, its status in text (WCAG 1.4.1)', async () => {
    renderInformation(() => initData())
    // With icons only, the status was told by the icons' colour alone.
    expect(await screen.findByTestId('status-report-props')).toHaveTextContent('iconsOnly:false')
  })

  it('tells when the hub is out of reach', async () => {
    renderInformation(() => initData({}, { hubIsAvailable: false }))
    expect(
      await screen.findByText(strings.ProjectInformationNoHubAccessMessage)
    ).toBeInTheDocument()
  })
})
