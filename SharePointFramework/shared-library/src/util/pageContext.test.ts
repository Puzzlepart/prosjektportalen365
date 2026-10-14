import { pageContextInfo, rememberPageContext, setPageContextInfo } from './pageContext'
import { OSLO_TIME_ZONE } from './testFixtures'

/**
 * Where the library reads the page's cultures and the site's time zone from: what SPFx gave
 * (`rememberPageContext`, from a client's creation), else `_spPageContextInfo` on the global
 * (a classic page, the integration harness), else nothing. Modern pages have no such global.
 */
describe('pageContextInfo', () => {
  afterEach(() => {
    setPageContextInfo(undefined)
    delete (window as any)._spPageContextInfo
  })

  it("reads the cultures and the site's time zone from an SPFx context", () => {
    rememberPageContext({
      pageContext: {
        cultureInfo: { currentUICultureName: 'en-US', currentCultureName: 'nb-NO' },
        legacyPageContext: { webTimeZoneData: OSLO_TIME_ZONE }
      }
    })
    expect(pageContextInfo()).toEqual({
      currentUICultureName: 'en-US',
      currentCultureName: 'nb-NO',
      webTimeZoneData: OSLO_TIME_ZONE
    })
  })

  it("prefers what SPFx gave to the page's global, and forgets it on undefined", () => {
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'sv-SE' }
    expect(pageContextInfo().currentUICultureName).toBe('sv-SE')
    setPageContextInfo({ currentUICultureName: 'en-GB' })
    expect(pageContextInfo().currentUICultureName).toBe('en-GB')
    setPageContextInfo(undefined)
    expect(pageContextInfo().currentUICultureName).toBe('sv-SE')
  })

  it('has nothing without a page context, and keeps what it has for a context without one', () => {
    expect(pageContextInfo()).toEqual({})
    setPageContextInfo({ currentUICultureName: 'en-GB' })
    rememberPageContext({} as any)
    rememberPageContext(undefined as any)
    expect(pageContextInfo().currentUICultureName).toBe('en-GB')
  })
})
