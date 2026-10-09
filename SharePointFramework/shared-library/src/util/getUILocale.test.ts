import { getUILocale } from './getUILocale'

/**
 * SharePoint's UI language, the one SPFx loads the strings for: the page context first, then
 * `<html lang>`, then Norwegian. Never the browser's language.
 */
describe('getUILocale', () => {
  afterEach(() => {
    delete (window as any)._spPageContextInfo
    document.documentElement.removeAttribute('lang')
  })

  it("reads SharePoint's UI culture from the page context first", () => {
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'en-US' }
    document.documentElement.lang = 'nb-NO'
    expect(getUILocale()).toBe('en-US')
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
