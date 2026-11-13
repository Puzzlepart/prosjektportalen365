import { devices, Page } from '@playwright/test'
import { baseURL, STORAGE_STATE } from '../../playwright.config'
import {
  configuredUrl,
  expect,
  guardTelemetry,
  TELEMETRY_ANSWER_HEADERS,
  TELEMETRY_FLAG,
  TELEMETRY_ROUTE,
  test,
  WEB_PART,
  withNetworkRetry
} from '../fixtures/pp365'
import { hubSettings, siteId } from '../fixtures/rest'

/**
 * Usage statistics as a browser sends them to Prosjektportalen Assist. Every other test keeps them
 * in the browser (`guardTelemetry`); here the guard is off, what goes to Assist is captured and
 * answered with 204 in Assist's place, and nothing reaches Assist.
 *
 * At the level the hub's settings give (read as the code reads them): a batch holds only the
 * fields the contract allows, the hub's host, URL and level, the test channel in a heartbeat,
 * site hashes of 16 hex characters that are no site's id, and nothing never sent (the test user,
 * an e-mail address, the page's title, another URL). It goes as `text/plain`, without a cookie or
 * a referrer. At level 0 nothing goes at all. A page that is closing sends at once: a `pagehide`
 * on the page sends what it has counted, the page staying where it is.
 *
 * The test hub's level is its own: no run writes it. At level 0 the first test checks only that
 * nothing is sent.
 */
test.use({ telemetryGuard: false })

const hub = baseURL.replace(/\/+$/, '')
const project = configuredUrl(process.env.E2E_PROJECT_URL)
const CHANNEL = process.env.E2E_CHANNEL || 'test'
const HOME_PAGES = ['Home.aspx', 'Hjem.aspx']

/** Where a batch of usage statistics goes (`shared-library/src/telemetry/contract.ts`). */
const USAGE_URL = 'https://assist.prosjektportalen.no/api/telemetry/usage'

/**
 * The field names a batch may carry. Kept here on purpose, not imported from the contract
 * (`TELEMETRY_FIELDS` in `shared-library/src/telemetry/contract.ts`): a field added there must be
 * added here too, with Assist's copy and the wiki page, or this spec fails.
 */
const ALLOWED_FIELDS: Record<string, string[]> = {
  envelope: [
    'schema',
    'batchId',
    'host',
    'tenantId',
    'hubUrl',
    'level',
    'appVersion',
    'heartbeat',
    'usage',
    'sites',
    'errors',
    'timings'
  ],
  heartbeat: [
    'channel',
    'templateVersion',
    'hubLanguage',
    'projects',
    'programs',
    'parentProjects',
    'catalog'
  ],
  usage: ['c', 'e', 's', 'v', 'n'],
  sites: ['h', 's'],
  errors: ['c', 'code', 'http', 'n'],
  timings: ['c', 'm', 'h']
}

/** A request to Assist, as the page sent it. */
interface ISent {
  url: string
  method: string
  headers: Record<string, string>
  body: string
}

/** One entry of a batch's usage. */
interface IUsageEntry {
  c: string
  e: string
  s: string
  v?: string
  n: number
}

/**
 * The level the hub's settings give, as the browsers' gate reads them
 * (`shared-library/src/telemetry/gate.ts`, rules 5 to 8): `CatalogTelemetryEnabled` = 0 stops
 * everything, and without an exact 0, 1, 2 or 3 in `UsageStatisticsLevel` nothing is sent.
 */
function levelOf(settings: Map<string, string>): number {
  if (settings.get('CatalogTelemetryEnabled')?.trim() === '0') return 0
  const value = settings.get('UsageStatisticsLevel')?.trim()
  return value !== undefined && ['0', '1', '2', '3'].includes(value) ? Number(value) : 0
}

/** Answers every request to Assist with 204 in Assist's place, and keeps what was sent. */
async function capture(page: Page): Promise<ISent[]> {
  const sent: ISent[] = []
  await page.route(TELEMETRY_ROUTE, async (route) => {
    const request = route.request()
    if (request.method() !== 'OPTIONS') {
      sent.push({
        url: request.url(),
        method: request.method(),
        headers: await request.allHeaders(),
        body: request.postData() ?? ''
      })
    }
    await route.fulfill({ status: 204, headers: TELEMETRY_ANSWER_HEADERS })
  })
  return sent
}

/** What a page that is closing does: it sends what it has counted at once. The page stays. */
async function sendAsClosing(page: Page): Promise<void> {
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
}

/**
 * Sends as a closing page does until something has gone: the gate reads the hub's level in the
 * background, and a send before it knows the level keeps what was counted for the next.
 */
async function sendUntilSent(page: Page, sent: ISent[]): Promise<void> {
  await expect
    .poll(
      async () => {
        await sendAsClosing(page)
        return sent.length
      },
      { timeout: 60_000, intervals: [2_000], message: 'no batch was sent' }
    )
    .toBeGreaterThan(0)
}

/** Sends as a closing page does, every other second for a while, and tells how many requests went. */
async function sendForAWhile(page: Page, sent: ISent[], milliseconds = 20_000): Promise<number> {
  const end = Date.now() + milliseconds
  while (Date.now() < end) {
    await sendAsClosing(page)
    await page.waitForTimeout(2_000)
  }
  return sent.length
}

/** The names of an object's fields the contract does not allow. */
function unknownFields(value: object, allowed: string[]): string[] {
  return Object.keys(value).filter((key) => !allowed.includes(key))
}

/** What the batches may never hold, and what they may: the hub's own URL and host. */
interface IExpected {
  level: number
  title: string
  siteIds: string[]
}

/**
 * Checks one request against the contract and the never-list, and returns its batch.
 *
 * @param sent The request, as the page sent it
 * @param expected The hub's level, the page's title and the ids of the sites in play
 */
function checkBatch(sent: ISent, expected: IExpected): Record<string, any> {
  expect(sent.url, 'only usage statistics go from these pages').toBe(USAGE_URL)
  expect(sent.method).toBe('POST')
  expect(sent.headers['content-type'] ?? '', 'sent as text').toMatch(/^text\/plain/i)
  expect(sent.headers['cookie'], 'sent without cookies').toBeUndefined()
  expect(sent.headers['referer'], "sent without the page's address").toBeUndefined()

  const batch = JSON.parse(sent.body) as Record<string, any>
  const host = new URL(hub).host.toLowerCase()
  expect(unknownFields(batch, ALLOWED_FIELDS.envelope), 'fields of the batch').toEqual([])
  expect(batch.schema).toBe(1)
  expect(batch.host).toBe(host)
  expect(batch.hubUrl).toBe(hub.toLowerCase())
  expect(batch.level, "the hub's level").toBe(expected.level)
  expect(batch.appVersion).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/)
  if (batch.heartbeat) {
    expect(
      unknownFields(batch.heartbeat, ALLOWED_FIELDS.heartbeat),
      'fields of the heartbeat'
    ).toEqual([])
    expect(batch.heartbeat.channel).toBe(CHANNEL)
  }
  for (const kind of ['usage', 'sites', 'errors', 'timings']) {
    for (const entry of (batch[kind] ?? []) as object[]) {
      expect(unknownFields(entry, ALLOWED_FIELDS[kind]), `fields of a ${kind} entry`).toEqual([])
    }
  }
  const ids = expected.siteIds.map((id) => id.replace(/[{}]/g, '').toLowerCase())
  for (const site of (batch.sites ?? []) as { h: string }[]) {
    expect(site.h, 'a site is told by a 16-character hash').toMatch(/^[0-9a-f]{16}$/)
    for (const id of ids) {
      expect(id.replace(/-/g, ''), 'a site hash is not the site id').not.toContain(site.h)
    }
  }

  // The hub's own URL and host may be sent; with them taken out, nothing of the never-list is left.
  const rest = sent.body.toLowerCase().split(hub.toLowerCase()).join('').split(host).join('')
  for (const id of ids) {
    expect(rest, 'no site id').not.toContain(id)
    expect(rest, 'no site id').not.toContain(id.replace(/-/g, ''))
  }
  const username = process.env.E2E_USERNAME?.toLowerCase()
  if (username) expect(rest, 'not the user').not.toContain(username)
  expect(rest, 'no e-mail address').not.toContain('@')
  const title = expected.title.trim().toLowerCase()
  if (title.length >= 4) expect(rest, "not the page's title").not.toContain(title)
  expect(rest, 'no other URL').not.toMatch(/:\/\/|sharepoint\.com|\/sites\/|\/teams\//)
  return batch
}

/** The usage entries of every batch. */
function usageOf(batches: Record<string, any>[]): IUsageEntry[] {
  return batches.flatMap((batch) => (batch.usage ?? []) as IUsageEntry[])
}

test.describe('usage statistics', () => {
  test("the hub's home sends what the contract allows at the hub's level, and nothing never sent", async ({
    page,
    openPage,
    resolvePage
  }) => {
    test.slow()
    const level = levelOf(await hubSettings(page, hub))
    const siteIds = [await siteId(page, hub)]
    const home = await resolvePage(hub, HOME_PAGES)
    const sent = await capture(page)
    await openPage(home)
    test.info().annotations.push({ type: 'usage statistics level', description: String(level) })

    if (level === 0) {
      expect(await sendForAWhile(page, sent), 'nothing is sent at level 0').toBe(0)
      return
    }
    if (level === 1) {
      // A heartbeat, and only from a user who manages the hub; nothing else at level 1.
      await sendForAWhile(page, sent)
      for (const request of sent) {
        const batch = checkBatch(request, { level, title: await page.title(), siteIds })
        expect(batch.heartbeat, 'a level 1 batch is a heartbeat').toBeDefined()
        expect(batch.usage, 'no usage at level 1').toBeUndefined()
      }
      return
    }
    await sendUntilSent(page, sent)
    const title = await page.title()
    const batches = sent.map((request) => checkBatch(request, { level, title, siteIds }))
    expect(
      usageOf(batches).filter((entry) => entry.c === 'Footer' && entry.e === 'page.viewed'),
      "the footer counts the hub's page view"
    ).toEqual([expect.objectContaining({ s: 'hub' })])
  })

  test("a project's home counts its web parts loaded on a project", async ({
    page,
    openPage,
    resolvePage
  }) => {
    test.skip(!project, 'E2E_PROJECT_URL is not set (or is the .env.example placeholder)')
    test.slow()
    const level = levelOf(await hubSettings(page, hub))
    test.skip(level < 2, `the hub's level is ${level}: web parts are counted from level 2`)
    const siteIds = [await siteId(page, hub), await siteId(page, project!)]
    const home = await resolvePage(project!, HOME_PAGES)
    const sent = await capture(page)
    await openPage(home)
    await sendUntilSent(page, sent)
    const title = await page.title()
    const batches = sent.map((request) => checkBatch(request, { level, title, siteIds }))
    expect(
      usageOf(batches).filter((entry) => entry.e === 'loaded' && entry.s === 'project'),
      'the web parts on the project home are counted as loaded on a project'
    ).not.toEqual([])
  })

  test('stores nothing in the browser: a page with usage statistics on keeps no key that one with them off lacks', async ({
    browser,
    resolvePage
  }) => {
    test.slow()
    const home = await resolvePage(hub, HOME_PAGES)
    const options = {
      ...devices['Desktop Chrome'],
      storageState: STORAGE_STATE,
      locale: 'nb-NO',
      timezoneId: 'Europe/Oslo'
    }

    /**
     * Loads the hub's home in a fresh context, sends as a closing page does for a while, and
     * returns the keys the page's storages hold then. Keys are told apart without their ids and
     * numbers, which SharePoint varies from one load to the next.
     */
    const keysAfterLoad = async (telemetryOn: boolean, milliseconds: number) => {
      const context = await browser.newContext(options)
      try {
        if (telemetryOn) {
          await context.route(TELEMETRY_ROUTE, (route) =>
            route.fulfill({ status: 204, headers: TELEMETRY_ANSWER_HEADERS })
          )
        } else {
          await guardTelemetry(context)
        }
        const page = await context.newPage()
        await withNetworkRetry(() => page.goto(home, { timeout: 90_000 }))
        await expect(page.locator(WEB_PART).first()).toBeVisible({ timeout: 60_000 })
        const end = Date.now() + milliseconds
        while (Date.now() < end) {
          await sendAsClosing(page)
          await page.waitForTimeout(2_000)
        }
        const keys = await page.evaluate(() => [
          ...Object.keys(window.localStorage).map((key) => `local:${key}`),
          ...Object.keys(window.sessionStorage).map((key) => `session:${key}`)
        ])
        return new Set(
          keys
            .filter((key) => !key.endsWith(`:${TELEMETRY_FLAG}`))
            .map((key) =>
              key
                .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<id>')
                .replace(/\d+/g, '<n>')
            )
        )
      } finally {
        await context.close()
      }
    }

    // The page with telemetry off gets more time: a key SharePoint writes late is then in it too.
    const on = await keysAfterLoad(true, 20_000)
    const off = await keysAfterLoad(false, 30_000)
    expect(
      [...on].filter((key) => !off.has(key)),
      'keys only a page with usage statistics on keeps'
    ).toEqual([])
  })
})
