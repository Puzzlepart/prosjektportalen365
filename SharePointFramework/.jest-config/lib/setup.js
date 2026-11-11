/**
 * Runs before each test file (Jest `setupFilesAfterEnv`).
 *
 * Adds the @testing-library/jest-dom matchers (`toBeInTheDocument`, `toHaveTextContent`, ...)
 * and polyfills the browser APIs that Fluent UI v8/v9 touch during render but jsdom does not
 * implement. Keep this list minimal and documented: every entry here is a difference between
 * the test environment and a real browser.
 */
require('@testing-library/jest-dom')

if (typeof window !== 'undefined') {
  // SharePoint pages expose the site theme on window.__themeState__; shared-library/src/util/theme.tsx
  // reads it at module load to derive the Fluent v9 brand ramp. Provide the default SharePoint
  // palette so importing the shared library does not throw. Tests that care about theming can
  // overwrite window.__themeState__.theme before importing.
  // The object must carry the fields @microsoft/load-themed-styles (Fluent v8's style loader)
  // initializes when it creates the state itself: it reuses an existing window.__themeState__ as is.
  if (!window.__themeState__) {
    window.__themeState__ = {
      lastStyleElement: undefined,
      registeredStyles: [],
      registeredThemableStyles: [],
      loadStyles: undefined,
      perf: { count: 0, duration: 0 },
      runState: { flushTimer: 0, mode: 0, buffer: [] },
      theme: {
        themePrimary: '#0078d4',
        themeDarkAlt: '#106ebe',
        themeDark: '#005a9e',
        themeDarker: '#004578',
        themeSecondary: '#2b88d8',
        themeTertiary: '#71afe5',
        themeLight: '#c7e0f4',
        themeLighter: '#deecf9',
        themeLighterAlt: '#eff6fc',
        neutralPrimary: '#323130',
        neutralSecondary: '#605e5c',
        neutralTertiary: '#a19f9d',
        neutralLight: '#edebe9',
        neutralLighter: '#f3f2f1',
        neutralLighterAlt: '#faf9f8',
        neutralDark: '#201f1e',
        black: '#000000',
        white: '#ffffff'
      }
    }
  }
  // Fluent UI v9 (useMediaQuery, Popover positioning) and Fluent v8 responsive mode.
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  }
  // Fluent v9 overflow/positioning hooks observe element sizes.
  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class IntersectionObserver {
      constructor() {
        this.root = null
        this.rootMargin = ''
        this.thresholds = []
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    }
  }
  if (!window.scrollTo) {
    window.scrollTo = () => undefined
  }
  // Fluent v8 reads this to decide whether the page is RTL.
  if (!document.documentElement.getAttribute('dir')) {
    document.documentElement.setAttribute('dir', 'ltr')
  }
}
