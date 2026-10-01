/**
 * The theme helper reads the site's theme off the window when it loads. It must not crash when the
 * theme is not there yet, which it is not for an early-loading application customizer, and it must
 * use the site's primary colour when it is.
 */
function loadTheme(themeState: unknown) {
  ;(window as any).__themeState__ = themeState
  let theme: typeof import('./theme')
  jest.isolateModules(() => {
    theme = jest.requireActual('./theme')
  })
  return theme!
}

describe('theme', () => {
  afterEach(() => {
    delete (window as any).__themeState__
  })

  it('falls back to the default primary colour when the page has no theme state', () => {
    const theme = loadTheme(undefined)
    expect(theme.themeColor).toBe('#0078d4')
    expect(theme.customLightTheme.colorBrandBackground).toBeTruthy()
  })

  it('falls back when the theme state has no theme', () => {
    expect(loadTheme({ theme: null }).themeColor).toBe('#0078d4')
  })

  it("uses the site's primary colour when it is published", () => {
    expect(loadTheme({ theme: { themePrimary: '#c7384f' } }).themeColor).toBe('#c7384f')
  })
})
