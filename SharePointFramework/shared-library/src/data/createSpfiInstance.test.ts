// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. `spfi().using(behaviour)` records the behaviour it was given,
// and `SPFx(context)` names the context it was built from, so the test reads which one was used.
// The harness maps every `@pnp/*` path to one stub file, so this mock also stands for the
// `@pnp/sp/presets/all` the module imports for its side effects.
jest.mock('@pnp/sp', () => ({
  SPFx: jest.fn((context: any) => `SPFx(${context.name})`),
  spfi: jest.fn(() => ({ using: (behaviour: unknown) => ({ behaviour }) }))
}))

import { getUILocale } from '../util/getUILocale'
import { setPageContextInfo } from '../util/pageContext'
import { getSiteTimeZone } from '../util/siteTimeZone'
import { OSLO_TIME_ZONE } from '../util/testFixtures'
import { createSpfiInstance, setSpfiFactory } from './createSpfiInstance'

/**
 * How the library's clients connect to SharePoint: through SPFx on a page, or through a factory
 * the integration tests register, which signs in from Node where there is no page. Every client
 * is created from the page's context, so this is where the library learns the page's cultures and
 * the site's time zone.
 */
describe('createSpfiInstance', () => {
  const context = { name: 'project' } as any

  afterEach(() => {
    setSpfiFactory(undefined)
    setPageContextInfo(undefined)
  })

  it("remembers the page's cultures and the site's time zone from the context", () => {
    createSpfiInstance({
      name: 'project',
      pageContext: {
        cultureInfo: { currentUICultureName: 'en-US', currentCultureName: 'nb-NO' },
        legacyPageContext: { webTimeZoneData: OSLO_TIME_ZONE }
      }
    } as any)
    expect(getUILocale()).toBe('en-US')
    expect(getSiteTimeZone()).toBe(OSLO_TIME_ZONE)
  })

  it('connects through SPFx by default', () => {
    expect((createSpfiInstance(context) as any).behaviour).toBe('SPFx(project)')
  })

  it('connects through a registered factory, given the same context', () => {
    const factory = jest.fn((c: any) => `signed in to ${c.name}`)
    setSpfiFactory(factory as any)
    expect((createSpfiInstance(context) as any).behaviour).toBe('signed in to project')
    expect(factory).toHaveBeenCalledWith(context)
  })

  it('connects through SPFx again once the factory is removed', () => {
    setSpfiFactory((() => 'factory') as any)
    setSpfiFactory(undefined)
    expect((createSpfiInstance(context) as any).behaviour).toBe('SPFx(project)')
  })
})
