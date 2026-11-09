import { getRegionalLocale, getUILocale } from './getUILocale'
import { setPageContextInfo } from './pageContext'

/**
 * SharePoint's UI language, the one SPFx loads the strings for: the page context first (what SPFx
 * gave, else the page's global), then `<html lang>`, then Norwegian. Never the browser's language.
 */
describe('getUILocale', () => {
  afterEach(() => {
    setPageContextInfo(undefined)
    delete (window as any)._spPageContextInfo
    document.documentElement.removeAttribute('lang')
  })

  it("reads SharePoint's UI culture from the page context first", () => {
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'en-US' }
    document.documentElement.lang = 'nb-NO'
    expect(getUILocale()).toBe('en-US')
  })

  it("reads the culture SPFx gave before the page's global", () => {
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'en-US' }
    setPageContextInfo({ currentUICultureName: 'en-GB', currentCultureName: 'sv-SE' })
    expect(getUILocale()).toBe('en-GB')
    expect(getRegionalLocale()).toBe('sv-SE')
  })

  it('falls back to the language SharePoint sets on the page', () => {
    ;(window as any)._spPageContextInfo = { currentUICultureName: '' }
    document.documentElement.lang = 'sv-SE'
    expect(getUILocale()).toBe('sv-SE')
  })

  it('falls back to Norwegian, not to the browser, when the page names no language', () => {
    expect(navigator.language).not.toBe('nb-NO')
    expect(getUILocale()).toBe('nb-NO')
  })
})

/**
 * SharePoint's regional format, the one it writes field values as text in: the page context's
 * culture, else the UI language.
 */
describe('getRegionalLocale', () => {
  afterEach(() => {
    delete (window as any)._spPageContextInfo
  })

  it("reads the site's regional culture from the page context, not the UI language", () => {
    ;(window as any)._spPageContextInfo = {
      currentCultureName: 'en-GB',
      currentUICultureName: 'nb-NO'
    }
    expect(getRegionalLocale()).toBe('en-GB')
  })

  it("falls back to SharePoint's UI language", () => {
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'en-US' }
    expect(getRegionalLocale()).toBe('en-US')
  })
})
