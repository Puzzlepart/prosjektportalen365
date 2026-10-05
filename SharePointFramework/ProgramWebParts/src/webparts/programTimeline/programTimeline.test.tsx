// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it initialises. The data
// adapter is `adapter`; the timeline (tested in the shared library) records its props.
;(globalThis as any).DEBUG = false
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  initChildProjects: jest.fn(() => Promise.resolve())
}
jest.mock('data/SPDataAdapter', () => ({ SPDataAdapter: jest.fn(() => adapter) }))
const rendered: { props?: any } = {}
jest.mock('pp365-shared-library/lib/components/ProjectTimeline', () => ({
  ProjectTimeline: (props: any) => {
    rendered.props = props
    return null
  }
}))

import { act } from '@testing-library/react'
import resource from 'SharedResources'
import ProgramTimelineWebPart from '.'
import { initWebPart, propertyPaneFields } from '../testFixtures'

describe('ProgramTimelineWebPart', () => {
  it('renders the timeline of the program with its properties and the data adapter', async () => {
    const webPart = await initWebPart(ProgramTimelineWebPart, {
      dataSourceName: 'Alle prosjektleveranser'
    })
    act(() => {
      webPart.render()
    })
    expect(rendered.props).toMatchObject({
      dataSourceName: 'Alle prosjektleveranser',
      dataAdapter: adapter,
      spfxContext: webPart.context,
      title: 'Underområder'
    })
  })

  it('lets the data source and the configuration item be set, with the defaults filled in', async () => {
    const webPart = await initWebPart(ProgramTimelineWebPart)
    const fields = propertyPaneFields(webPart)
    expect(Object.keys(fields)).toEqual(['dataSourceName', 'configItemTitle'])
    expect(fields.dataSourceName.value).toBe(
      resource.Lists_DataSources_Category_ProjectDeliveries_All
    )
    expect(fields.configItemTitle.value).toBe(resource.TimelineConfiguration_ProjectDelivery_Title)
  })
})
