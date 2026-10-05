// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it initialises. The data
// adapter is `adapter`; the program administration (tested on its own) records its props.
;(globalThis as any).DEBUG = false
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  initChildProjects: jest.fn(() => Promise.resolve())
}
jest.mock('data/SPDataAdapter', () => ({ SPDataAdapter: jest.fn(() => adapter) }))
const rendered: { props?: any } = {}
jest.mock('components/ProgramAdministration/ProgramAdministration', () => {
  const React = jest.requireActual('react')
  return {
    ProgramAdministration: (props: any) => {
      rendered.props = props
      return React.createElement('span', null, 'Programadministrasjon')
    }
  }
})

import { act } from '@testing-library/react'
import ProgramAdministrationWebPart from '.'
import { SITE, initWebPart } from '../testFixtures'

describe('ProgramAdministrationWebPart', () => {
  it('configures the data adapter for the site, with the global settings, and finds the child projects', async () => {
    const webPart = await initWebPart(ProgramAdministrationWebPart)
    expect(adapter.configure).toHaveBeenCalledWith(webPart.context, {
      siteId: 'site-1',
      webUrl: SITE,
      loadGlobalSettings: true,
      logLevel: expect.anything()
    })
    expect(adapter.initChildProjects).toHaveBeenCalled()
  })

  it('renders the program administration with the context, the data adapter and its title', async () => {
    const webPart = await initWebPart(ProgramAdministrationWebPart, {}, 2)
    act(() => {
      webPart.render()
    })
    expect(rendered.props).toMatchObject({
      context: webPart.context,
      spfxContext: webPart.context,
      pageContext: webPart.context.pageContext,
      dataAdapter: adapter,
      displayMode: 2,
      title: 'Underområder'
    })
    expect(webPart.domElement).toHaveTextContent('Programadministrasjon')
    expect(webPart.getPropertyPaneConfiguration()).toEqual({ pages: [] })
  })

  it('unmounts when SharePoint disposes of it', async () => {
    const webPart = await initWebPart(ProgramAdministrationWebPart)
    act(() => {
      webPart.render()
    })
    act(() => {
      webPart.onDispose()
    })
    expect(webPart.domElement).toBeEmptyDOMElement()
  })
})
