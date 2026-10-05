// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it initialises. The data
// adapter is `adapter`; the portfolio overview (tested in PortfolioWebParts) records its props.
;(globalThis as any).DEBUG = false
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  initChildProjects: jest.fn(() => Promise.resolve()),
  getPortfolioConfig: jest.fn()
}
jest.mock('data/SPDataAdapter', () => ({ SPDataAdapter: jest.fn(() => adapter) }))
const rendered: { props?: any } = {}
jest.mock('pp365-portfoliowebparts/lib/components/PortfolioOverview', () => ({
  PortfolioOverview: (props: any) => {
    rendered.props = props
    return null
  }
}))

import { act } from '@testing-library/react'
import strings from 'ProgramWebPartsStrings'
import resource from 'SharedResources'
import ProgramProjectOverview from '.'
import { initWebPart, propertyPaneFields } from '../testFixtures'

const CONFIGURATION = {
  views: [
    { id: 1, title: 'Alle prosjekter' },
    { id: 2, title: 'Mine prosjekter' }
  ]
}

beforeEach(() => {
  rendered.props = undefined
  adapter.getPortfolioConfig.mockImplementation(() => Promise.resolve(CONFIGURATION))
})

describe('ProgramProjectOverview', () => {
  it("renders the overview of the program's projects with the portfolio configuration", async () => {
    const webPart = await initWebPart(ProgramProjectOverview)
    act(() => {
      webPart.render()
    })
    expect(rendered.props).toMatchObject({
      configuration: CONFIGURATION,
      isParentProject: true,
      dataAdapter: adapter,
      title: resource.WebParts_ProgramProjectOverview_Title
    })
  })

  it('says what went wrong when the configuration cannot be read', async () => {
    adapter.getPortfolioConfig.mockImplementation(() =>
      Promise.reject({ name: 'Ingen visninger', message: 'Fant ingen visninger.', intent: 'error' })
    )
    const webPart = await initWebPart(ProgramProjectOverview)
    act(() => {
      webPart.render()
    })
    expect(rendered.props).toBeUndefined()
    expect(webPart.domElement).toHaveTextContent('Ingen visninger')
    expect(webPart.domElement).toHaveTextContent('Fant ingen visninger.')
  })

  it('falls back to a general title for an error without one', async () => {
    adapter.getPortfolioConfig.mockImplementation(() => Promise.reject({}))
    const webPart = await initWebPart(ProgramProjectOverview)
    act(() => {
      webPart.render()
    })
    expect(webPart.domElement).toHaveTextContent(strings.ErrorTitle)
  })

  it('offers the views of the configuration as the default view', async () => {
    const webPart = await initWebPart(ProgramProjectOverview)
    expect(propertyPaneFields(webPart).defaultViewId.options).toEqual([
      { key: null, text: '' },
      { key: 1, text: 'Alle prosjekter' },
      { key: 2, text: 'Mine prosjekter' }
    ])
  })

  it('offers no views when there is no configuration', async () => {
    adapter.getPortfolioConfig.mockImplementation(() => Promise.reject(new Error('Nei')))
    const webPart = await initWebPart(ProgramProjectOverview)
    expect(propertyPaneFields(webPart).defaultViewId.options).toEqual([])
  })
})
