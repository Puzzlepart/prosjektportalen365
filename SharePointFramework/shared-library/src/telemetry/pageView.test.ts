import { attachTelemetryPortal, flushTelemetry } from './flush'
import {
  HUB_SITE_ID,
  hubPage,
  hubPortal,
  ITelemetryTestBed,
  PROJECT_SITE_ID,
  projectPage,
  settingsMap,
  settle,
  telemetryStore,
  telemetryTestBed
} from './__fixtures__/testFixtures'
import { registerSiteTypeResolver, startTelemetry, trackPageView, trackUsage } from './track'

/**
 * The Footer's page views. A site can carry the footers of two channels, and each bundle reports
 * the page it is on to the window's one store: a page is counted once, whichever footer reports
 * it first, and counted again when the user goes to another page.
 */
const HOME = '/sites/prosjektportalen/SitePages/Home.aspx'
const OVERVIEW = '/sites/prosjektportalen/SitePages/Portefoljeoversikt.aspx'
const PROJECT_HOME = '/sites/frisbee/SitePages/ProjectHome.aspx'

let bed: ITelemetryTestBed

beforeEach(() => {
  bed = telemetryTestBed()
  bed.navigate(HOME)
})

afterEach(() => bed.restore())

/** Starts on a hub page at level 2, with the settings in hand. */
async function start(level: string = '2', page = hubPage()): Promise<void> {
  startTelemetry(page)
  attachTelemetryPortal(hubPortal(), settingsMap(level))
  await settle()
}

/** How many page views are in memory, on every site. */
function pageViews(): number {
  const { usage } = telemetryStore()
  return Object.keys(usage)
    .filter((key) => usage[key].e === 'page.viewed')
    .reduce((sum, key) => sum + usage[key].n, 0)
}

/** Two copies of the tracking module, as the footers of two channels on one page have. */
function twoFooters(): Array<typeof import('./track')> {
  const load = (): typeof import('./track') => {
    let copy: typeof import('./track')
    jest.isolateModules(() => {
      copy = jest.requireActual('./track')
    })
    return copy
  }
  return [load(), load()]
}

describe('trackPageView', () => {
  it('counts the page once, however many times it is reported', async () => {
    await start()
    trackPageView('Footer')
    trackPageView('Footer')
    trackPageView('Footer')
    expect(pageViews()).toBe(1)
  })

  it('counts one view for the two footers of a site with two channels, on each page', async () => {
    const [main, test] = twoFooters()
    expect(main.trackPageView).not.toBe(test.trackPageView)
    main.startTelemetry(hubPage())
    test.startTelemetry(hubPage())
    attachTelemetryPortal(hubPortal(), settingsMap('2'))
    main.trackPageView('Footer')
    test.trackPageView('Footer')
    expect(pageViews()).toBe(1)

    // The user goes to another page of the hub: both footers hear of it, in any order.
    bed.navigate(OVERVIEW)
    test.startTelemetry(hubPage())
    test.trackPageView('Footer')
    main.startTelemetry(hubPage())
    main.trackPageView('Footer')
    expect(pageViews()).toBe(2)

    await settle()
    flushTelemetry({ urgent: true })
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].usage).toEqual([{ c: 'Footer', e: 'page.viewed', s: 'hub', n: 2 }])
  })

  it('counts a page again when the user comes back to it', async () => {
    await start()
    trackPageView('Footer')
    bed.navigate(OVERVIEW)
    trackPageView('Footer')
    bed.navigate(HOME)
    trackPageView('Footer')
    expect(pageViews()).toBe(3)
  })

  it('counts the view on the site of the page, with that site type', async () => {
    await start()
    trackPageView('Footer')

    bed.navigate(PROJECT_HOME)
    startTelemetry(projectPage())
    registerSiteTypeResolver(PROJECT_SITE_ID, () => Promise.resolve('program'))
    trackPageView('Footer')
    trackPageView('Footer')
    await settle()

    const { usage } = telemetryStore()
    expect(Object.keys(usage).map((key) => [usage[key].siteId, usage[key].n])).toEqual([
      [HUB_SITE_ID, 1],
      [PROJECT_SITE_ID, 1]
    ])
    flushTelemetry({ urgent: true })
    expect(bed.batches()[0].usage).toEqual([
      { c: 'Footer', e: 'page.viewed', s: 'hub', n: 1 },
      { c: 'Footer', e: 'page.viewed', s: 'program', n: 1 }
    ])
  })

  it('takes a view that is switched or a folder that is opened for the same page', async () => {
    const list = '/sites/prosjektportalen/Lists/Prosjekter/AllItems.aspx'
    bed.navigate(list)
    await start()
    trackPageView('Footer')
    bed.navigate(`${list}?viewid=8f1f38cb-7eb2-4122-a866-4c9e99b2ebed`)
    trackPageView('Footer')
    bed.navigate(`${list}?id=%2Fsites%2Fprosjektportalen%2FLists%2FProsjekter%2FMappe#ideaId=3`)
    trackPageView('Footer')
    expect(pageViews()).toBe(1)
  })

  it('takes an address in another case, or with a slash after it, for the same page', async () => {
    bed.navigate('/sites/prosjektportalen')
    await start()
    trackPageView('Footer')
    bed.navigate('/sites/Prosjektportalen/')
    trackPageView('Footer')
    bed.navigate('/SITES/PROSJEKTPORTALEN')
    trackPageView('Footer')
    expect(pageViews()).toBe(1)
  })

  it('keeps the last page as a key without its address, and puts the key in no batch', async () => {
    bed.navigate('/sites/hemmelig-prosjekt/SitePages/Lonnsoversikt.aspx?kandidat=kari')
    await start('3')
    trackPageView('Footer')
    const { lastPageViewKey } = telemetryStore()
    const [siteId, pathHash, ...more] = lastPageViewKey.split('|')
    expect(siteId).toBe(HUB_SITE_ID)
    expect(pathHash).toMatch(/^[0-9a-f]{1,8}$/)
    expect(more).toEqual([])
    const kept = JSON.stringify(telemetryStore()).toLowerCase()
    ;['hemmelig', 'lonnsoversikt', 'kandidat', 'kari', 'sitepages'].forEach((part) =>
      expect(kept).not.toContain(part)
    )

    flushTelemetry({ urgent: true })
    const body = bed.fetch.mock.calls[0][1].body as string
    expect(body).not.toContain(lastPageViewKey)
    expect(body).not.toContain(pathHash)
    expect(body.toLowerCase()).not.toContain('hemmelig')
    expect(Object.keys(JSON.parse(body))).not.toContain('lastPageViewKey')
  })

  it('remembers the page also when its view is not counted, below level 2', async () => {
    await start('1')
    trackPageView('Footer')
    trackPageView('Footer')
    expect(pageViews()).toBe(0)
    expect(telemetryStore().lastPageViewKey).toBeDefined()
  })

  it('counts nothing on a page without a site id, or for another component than the Footer', async () => {
    await start('2', hubPage({ siteId: '' }))
    trackPageView('Footer')
    expect(pageViews()).toBe(0)
    expect(telemetryStore().lastPageViewKey).toBeUndefined()

    bed.restore()
    bed = telemetryTestBed()
    await start()
    // @ts-expect-error -- `page.viewed` is the Footer's event, not a web part's
    trackPageView('ProjectStatusWebPart')
    expect(pageViews()).toBe(0)
    // Such a call does not stand in the way of the Footer's own.
    trackPageView('Footer')
    expect(pageViews()).toBe(1)
  })

  it('does nothing before telemetry is started, and never throws', () => {
    expect(() => trackPageView('Footer')).not.toThrow()
    expect(telemetryStore()).toBeUndefined()
    expect(() => trackPageView(undefined)).not.toThrow()

    startTelemetry(hubPage())
    jest.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('no clock')
    })
    expect(() => trackPageView('Footer')).not.toThrow()
  })

  it('is one page view among the other events of the Footer', async () => {
    await start()
    trackPageView('Footer')
    trackUsage('Footer', 'help.opened')
    trackPageView('Footer')
    flushTelemetry({ urgent: true })
    expect(bed.batches()[0].usage).toEqual([
      { c: 'Footer', e: 'help.opened', s: 'hub', n: 1 },
      { c: 'Footer', e: 'page.viewed', s: 'hub', n: 1 }
    ])
  })
})
