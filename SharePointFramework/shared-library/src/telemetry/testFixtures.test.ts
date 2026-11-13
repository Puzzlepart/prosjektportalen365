import {
  clearTestTelemetry,
  countedTelemetry,
  HUB_SNAPSHOT,
  hubPage,
  hubPortal,
  navigateTestPage,
  PROJECT_SITE_ID,
  projectPage,
  settingsMap,
  startTestTelemetry,
  telemetryTestBed
} from './__fixtures__/testFixtures'
import { startTelemetry, trackError, trackPageView, trackTiming, trackUsage } from './track'

/**
 * The fixtures every solution's telemetry tests count through, and the test bed that takes over
 * the window. A fixture that is wrong lets those tests pass, or fail, for the wrong reason.
 */
describe('the telemetry test fixtures', () => {
  afterEach(() => clearTestTelemetry())

  it('sum an event counted on two sites under its one name', () => {
    startTestTelemetry(hubPage())
    trackUsage('Footer', 'page.viewed')
    // The Footer reports an SPA navigation to a project of the hub.
    startTelemetry(projectPage())
    trackUsage('Footer', 'page.viewed')
    trackUsage('Footer', 'page.viewed')
    trackError('Footer', 'render_failed')
    trackError('Footer', 'render_failed')
    trackTiming('ProjectStatusWebPart', 'init', 100)
    trackTiming('ProjectStatusWebPart', 'init', 9000)

    expect(countedTelemetry()).toEqual({
      usage: { 'Footer page.viewed': 3 },
      errors: { 'Footer render_failed': 2 },
      timings: { 'ProjectStatusWebPart init': 2 }
    })
  })

  it('give a portal that answers the reads a bundle makes through the hub', async () => {
    const portal = hubPortal(settingsMap('3'))
    expect((await portal.getGlobalSettings()).get('UsageStatisticsLevel')).toBe('3')
    expect(await portal.getUsageSnapshot()).toEqual(HUB_SNAPSHOT)
    expect(await portal.getSiteKind(PROJECT_SITE_ID)).toBe('project')
    // Each portal answers with a snapshot of its own: a test may change one.
    expect(await portal.getUsageSnapshot()).not.toBe(HUB_SNAPSHOT)

    const program = hubPortal(undefined, { getSiteKind: jest.fn(() => Promise.resolve('program')) })
    expect(await program.getSiteKind(PROJECT_SITE_ID)).toBe('program')
    expect(program.getUsageSnapshot).not.toHaveBeenCalled()
  })

  it('count a page view once per page, and move between pages without loading one', () => {
    const path = window.location.pathname
    startTestTelemetry(hubPage())
    trackPageView('Footer')
    trackPageView('Footer')
    navigateTestPage('/sites/prosjektportalen/SitePages/Portefoljeoversikt.aspx')
    expect(window.location.pathname).toBe(
      '/sites/prosjektportalen/SitePages/Portefoljeoversikt.aspx'
    )
    trackPageView('Footer')
    expect(countedTelemetry().usage).toEqual({ 'Footer page.viewed': 2 })
    navigateTestPage(path)
    expect(window.location.pathname).toBe(path)
  })

  it('put the address back when the test bed is restored', () => {
    const address = window.location.href
    const bed = telemetryTestBed()
    bed.navigate('/sites/frisbee/SitePages/ProjectHome.aspx?debug=1#ideaId=3')
    expect(window.location.pathname).toBe('/sites/frisbee/SitePages/ProjectHome.aspx')
    bed.restore()
    expect(window.location.href).toBe(address)
  })

  it("register a listener with its options, and take only telemetry's own away again", () => {
    const bed = telemetryTestBed()
    const button = document.body.appendChild(document.createElement('button'))
    const stop = (event: Event): void => event.stopPropagation()
    // Counted by hand: the bed's `restore` resets Jest's mocks.
    let heard = 0
    const listener = (): void => {
      heard++
    }
    button.addEventListener('click', stop)
    try {
      // As Fluent listens for a click outside a popover: on the document, in the capture phase.
      document.addEventListener('click', listener, true)
      startTelemetry(hubPage())
      // Registered without its options it would hear the click as it bubbles, which `stop` prevents.
      button.click()
      expect(heard).toBe(1)

      bed.restore()
      button.click()
      expect(heard).toBe(2)

      // Its owner still removes it the way it was added.
      document.removeEventListener('click', listener, true)
      button.click()
      expect(heard).toBe(2)
    } finally {
      bed.restore()
      document.removeEventListener('click', listener, true)
      button.remove()
    }
  })
})
