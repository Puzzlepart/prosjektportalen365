;(globalThis as any).DEBUG = false
jest.mock('components/ProjectInformation', () => ({
  ProjectInformation: () => null,
  PROJECT_INFORMATION_DEFAULT_PROPS: {
    minRowLimit: 4,
    maxRowLimit: 100,
    showSustainabilityGoalsAsIcons: false,
    sustainabilityGoalIconSize: 48,
    statusReportShowOnlyIcons: true
  }
}))

import strings from 'ProjectWebPartsStrings'
import resource from 'SharedResources'
import ProjectInformationWebPart from './index'

function createWebPart(properties: Record<string, any> = {}) {
  const webPart: any = new ProjectInformationWebPart()
  webPart.properties = properties
  return webPart
}

function sustainabilityFields(webPart: any): Record<string, any> {
  const groups = webPart.getPropertyPaneConfiguration().pages[0].groups
  const group = groups.find(
    ({ groupName }) => groupName === resource.SiteFields_GtUNSustDevGoals_DisplayName
  )
  return Object.fromEntries(
    group.groupFields.map((field) => [field.targetProperty, field.properties])
  )
}

describe('ProjectInformation web part sustainability properties', () => {
  it('renders tags by default and hides the icon size choice', () => {
    const fields = sustainabilityFields(createWebPart())

    expect(fields.showSustainabilityGoalsAsIcons).toMatchObject({
      label: strings.ShowSustainabilityGoalsAsIconsLabel,
      checked: false
    })
    expect(fields.sustainabilityGoalIconSize).toBeUndefined()
  })

  it('offers a valid icon size when icon rendering is enabled', () => {
    const fields = sustainabilityFields(createWebPart({ showSustainabilityGoalsAsIcons: true }))

    expect(fields.showSustainabilityGoalsAsIcons.checked).toBe(true)
    expect(fields.sustainabilityGoalIconSize).toMatchObject({
      label: strings.SustainabilityGoalIconSizeLabel,
      selectedKey: 48
    })
    expect(fields.sustainabilityGoalIconSize.options).toEqual([
      { key: 32, text: '32 px' },
      { key: 48, text: '48 px' },
      { key: 64, text: '64 px' }
    ])
  })
})

/** The fields of the property pane's status report group, by the property they set. */
function statusReportFields(webPart: any): Record<string, any> {
  const groups = webPart.getPropertyPaneConfiguration().pages[0].groups
  const group = groups.find(({ groupName }) => groupName === strings.ProjectStatusGroupName)
  return Object.fromEntries(
    group.groupFields.map((field) => [field.targetProperty, field.properties])
  )
}

describe('ProjectInformation web part status report properties', () => {
  it('shows the status report as icons by default, with no warning, for their marks tell the status by shape (WCAG 1.4.1)', () => {
    const fields = statusReportFields(createWebPart())
    expect(fields.statusReportShowOnlyIcons.checked).toBe(true)
    expect(fields.statusReportShowOnlyIconsWarning).toBeUndefined()
    expect(Object.keys(fields)).toEqual(['hideStatusReport', 'statusReportShowOnlyIcons'])
  })

  it('offers the comment length for the full report', () => {
    const fields = statusReportFields(createWebPart({ statusReportShowOnlyIcons: false }))
    expect(fields.statusReportShowOnlyIcons.checked).toBe(false)
    expect(fields.statusReportTruncateComments).toBeDefined()
  })
})
