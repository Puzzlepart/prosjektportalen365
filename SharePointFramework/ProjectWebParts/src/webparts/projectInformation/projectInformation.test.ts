;(globalThis as any).DEBUG = false
jest.mock('components/ProjectInformation', () => ({
  ProjectInformation: () => null,
  PROJECT_INFORMATION_DEFAULT_PROPS: {
    minRowLimit: 4,
    maxRowLimit: 100,
    showSustainabilityGoals: true,
    sustainabilityGoalIconSize: 48
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
  it('offers a visible section and a valid default icon size', () => {
    const fields = sustainabilityFields(createWebPart())

    expect(fields.showSustainabilityGoals).toMatchObject({
      label: strings.ShowSustainabilityGoalsLabel,
      checked: true
    })
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

  it('hides the size choice when the section is disabled', () => {
    const fields = sustainabilityFields(createWebPart({ showSustainabilityGoals: false }))

    expect(fields.showSustainabilityGoals.checked).toBe(false)
    expect(fields.sustainabilityGoalIconSize).toBeUndefined()
  })
})
