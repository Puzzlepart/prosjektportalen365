import { expect, test as base, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Browser-side failures that mean the deployed bundles are broken, not the page content.
 * "Cannot find module" and "Failed to load component" are what an accidentally externalized
 * shared library or a missing chunk look like; "ChunkLoadError" is a bundle that 404s.
 */
const FATAL_CONSOLE_PATTERNS = [
  /cannot find module/i,
  /failed to load component/i,
  // SPFx's module loader reporting that a web part bundle threw while being required, for example
  // "Could not load portfolio-overview-web-part in require. TypeError: ..." when a stylesheet
  // import resolved to undefined.
  /could not load .+ in require/i,
  /chunkloaderror/i,
  /is not a function/i,
  /webpackJsonp/i
]

export interface Pp365Fixtures {
  /** Collects console errors and page errors while a test runs; fatal ones fail the test at the end. */
  consoleGuard: { errors: string[] }
  /** Navigates to a page of the hub or a project and waits for the SPFx canvas to render. */
  openPage: (path: string) => Promise<void>
  /**
   * Resolves which of several candidate page names exists in a site's SitePages library (case
   * insensitive) and returns its site-relative path. Skips the test with the list of pages that do
   * exist when none of the candidates is found, so a differently provisioned tenant reports itself.
   */
  resolvePage: (siteUrl: string, candidates: string[]) => Promise<string>
}

/** Placeholder values copied from .env.example must not be treated as configuration. */
export function configuredUrl(value: string | undefined): string | undefined {
  if (!value || /[<>]/.test(value)) return undefined
  return value.replace(/\/+$/, '')
}

/**
 * The test runner leaves `page.request` without a timeout of its own, so a REST call whose
 * connection stalls runs until the test's timeout (a four-minute hang in one CI run, on the
 * SitePages listing). Bounded and sent once more, a stall costs seconds instead of the test.
 */
export const REQUEST_TIMEOUT = 30_000

/**
 * Errors from the connection to SharePoint, as opposed to an answer from SharePoint: Chromium's
 * net errors, its error page (a navigation "interrupted by another navigation to chrome-error://"),
 * a request that hit REQUEST_TIMEOUT ("Timeout 30000ms exceeded", Playwright's own wording) and a
 * dropped socket.
 */
const NETWORK_ERROR = /net::ERR_|chrome-error:\/\//i
const NETWORK_ERROR_TEXT = /Timeout \d+ms exceeded|socket hang up|ECONNRESET/i

/** A pause between the attempts, so a momentary drop in the connection has passed. */
const RETRY_DELAY = 3_000

/** Runs a request or navigation, sending it a second time when the first attempt failed at the network level. */
export async function withNetworkRetry<T>(send: () => Promise<T>): Promise<T> {
  try {
    return await send()
  } catch (error) {
    const message = String((error as Error)?.message ?? error)
    if (!NETWORK_ERROR.test(message) && !NETWORK_ERROR_TEXT.test(message)) throw error
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
    return await send()
  }
}

// A site's pages do not change during a run, and every test resolves its page before it starts:
// one listing per site per worker, instead of one per test.
const sitePagesCache = new Map<string, string[]>()

/** Lists the file names in a site's SitePages library through the REST API, using the signed-in session. */
export async function listSitePages(page: Page, siteUrl: string): Promise<string[]> {
  const site = siteUrl.replace(/\/+$/, '')
  const cached = sitePagesCache.get(site)
  if (cached) return cached
  const sitePath = new URL(site).pathname
  const response = await withNetworkRetry(() =>
    page.request.get(
      `${site}/_api/web/GetFolderByServerRelativePath(decodedurl='${encodeURIComponent(sitePath + '/SitePages')}')/Files?$select=Name&$top=500`,
      { headers: { Accept: 'application/json;odata=nometadata' }, timeout: REQUEST_TIMEOUT }
    )
  )
  if (!response.ok()) {
    throw new Error(
      `Could not list SitePages of ${site}: HTTP ${response.status()} ${await response.text()}`
    )
  }
  const body = (await response.json()) as { value: { Name: string }[] }
  const pages = body.value.map((file) => file.Name)
  sitePagesCache.set(site, pages)
  return pages
}

export const test = base.extend<Pp365Fixtures>({
  consoleGuard: async ({ page }, use) => {
    const errors: string[] = []
    page.on('console', (message) => {
      // SharePoint's own telemetry (clarity.ms) trips the page CSP on every load; not ours.
      if (
        message.type() === 'error' &&
        !/clarity\.ms|Content Security Policy/.test(message.text())
      ) {
        errors.push(message.text())
      }
    })
    page.on('pageerror', (error) =>
      errors.push(`pageerror: ${error.message} ${error.stack ?? ''}`.trim())
    )
    await use({ errors })
    // Every browser error is attached to the report as evidence; only the patterns that mean a
    // broken bundle fail the test. The "pageerror: undefined" on most pages is SharePoint's own:
    // a promise its page assembly (sp-pages-assembly) rejects with no reason as the page loads,
    // traced with the debugger on 2026-10-19, as are its list bundle's rejections on project pages.
    if (errors.length > 0) {
      await base
        .info()
        .attach('browser-errors.txt', { body: errors.join('\n'), contentType: 'text/plain' })
    }
    const fatal = errors.filter((text) =>
      FATAL_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))
    )
    expect(fatal, `Fatal browser errors:\n${fatal.join('\n')}`).toEqual([])
  },
  openPage: async ({ page, consoleGuard }, use) => {
    void consoleGuard
    await use(async (path: string) => {
      // Chromium gives up on a connection SharePoint never answers with net::ERR_TIMED_OUT (a
      // smoke test in CI); a second attempt is what a user would do.
      const response = await withNetworkRetry(() => page.goto(path))
      // SharePoint answers a missing page with a bare "404 FILE NOT FOUND" body and HTTP 404.
      // Report the URL that was tried instead of timing out on the canvas locator.
      if (response && response.status() === 404) {
        throw new Error(`Page not found: ${response.url()}`)
      }
      await expectCanvasRendered(page)
      await expectReleaseChannel(page)
      // Every PP365 web part renders the same error boundary when its bundle or data fails; one
      // of these headings on a smoke page is a failure regardless of what else mounted.
      await expect(
        page.getByRole('heading', { name: /noe gikk galt|something went wrong/i }),
        'a web part rendered its error boundary'
      ).toHaveCount(0)
    })
  },
  resolvePage: async ({ page }, use) => {
    await use(async (siteUrl: string, candidates: string[]) => {
      const pages = await listSitePages(page, siteUrl)
      const match = candidates.find((candidate) =>
        pages.some((name) => name.toLowerCase() === candidate.toLowerCase())
      )
      if (!match) {
        base.skip(
          true,
          `None of [${candidates.join(', ')}] exists in ${siteUrl}/SitePages. Pages found: ${pages.join(', ')}`
        )
      }
      const actual = pages.find((name) => name.toLowerCase() === match!.toLowerCase())!
      return `${siteUrl.replace(/\/+$/, '')}/SitePages/${actual}`
    })
  }
})

export { expect }

/** Selector for a mounted SPFx web part. Present on canvas pages and on single web part app pages alike. */
export const WEB_PART = '[data-sp-web-part-id]'

/** The release channel under test: the test channel, which CI deploys before the suite runs. */
const CHANNEL = process.env.E2E_CHANNEL || 'test'

/**
 * Every PP365 component id of every release channel (`channels/<name>.json`), with its channel and
 * its name: what tells a page's web part of the channel under test from another channel's.
 */
const CHANNEL_COMPONENTS: Map<string, { channel: string; name: string }> = (() => {
  const components = new Map<string, { channel: string; name: string }>()
  const dir = path.resolve(__dirname, '..', '..', '..', 'channels')
  for (const file of fs.readdirSync(dir).filter((name) => /^[a-z0-9]+\.json$/.test(name))) {
    const channel = file.replace(/\.json$/, '')
    const walk = (node: unknown, key: string) => {
      if (typeof node === 'string' && /^[0-9a-f-]{36}$/i.test(node)) {
        components.set(node.toLowerCase(), { channel, name: key })
      } else if (node && typeof node === 'object') {
        for (const [childKey, child] of Object.entries(node)) walk(child, childKey)
      }
    }
    walk(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')), '')
  }
  return components
})()

/**
 * The web parts on the page that are PP365 components of the channel under test, each with the
 * alias `channels/<channel>.json` gives it ("ProjectInformationWebPart") and a CSS selector for
 * its containers, in page order. A web part used twice on a page is listed once; its selector
 * matches both.
 */
export async function channelWebPartsOnPage(
  page: Page
): Promise<Array<{ alias: string; selector: string }>> {
  const ids = await page
    .locator(WEB_PART)
    .evaluateAll((elements) =>
      elements.map((e) => (e.getAttribute('data-sp-web-part-id') ?? '').toLowerCase())
    )
  const parts = new Map<string, { alias: string; selector: string }>()
  for (const id of ids) {
    const component = CHANNEL_COMPONENTS.get(id)
    if (!component || component.channel !== CHANNEL || parts.has(id)) continue
    parts.set(id, { alias: component.name, selector: `[data-sp-web-part-id="${id}" i]` })
  }
  return [...parts.values()]
}

/**
 * Fails when a web part on the page is a PP365 component of another release channel than the one
 * under test. Such a page runs that channel's code (the main channel's is the last release), so a
 * pass or a failure there says nothing about this build: on 2026-10-09 three of the hub's
 * aggregated overviews, the dynamic list and the project's timeline turned out to run the main
 * channel's. Out-of-the-box web parts are left alone.
 */
export async function expectReleaseChannel(page: Page): Promise<void> {
  const webParts = await page.locator(WEB_PART).evaluateAll((elements) =>
    elements.map((e) => ({
      id: (e.getAttribute('data-sp-web-part-id') ?? '').toLowerCase(),
      // "RiskMatrixWebPart web part (Risikomatrise)" on canvas pages; app pages have no tag.
      alias: /^(\w+) web part/.exec(e.getAttribute('data-sp-feature-tag') ?? '')?.[1]
    }))
  )
  const names = new Set(
    [...CHANNEL_COMPONENTS.values()].filter((c) => c.channel === CHANNEL).map((c) => c.name)
  )
  const foreign = webParts
    .map(({ id, alias }) => {
      const component = CHANNEL_COMPONENTS.get(id)
      if (component) return component.channel === CHANNEL ? undefined : component
      // A PP365 web part whose id no channel file knows: a package outside the channels, as the
      // old packages a tenant's app catalog keeps (a 1.8.1 risk matrix on the test tenant).
      return alias && names.has(alias) ? { name: alias, channel: `package ${id}` } : undefined
    })
    .filter((component) => component)
    .map((component) => `${component!.name} (${component!.channel})`)
  expect(
    foreign,
    `${page.url()} runs web parts of another release channel than "${CHANNEL}"; point them at the ` +
      `${CHANNEL} channel's components (channels/${CHANNEL}.json)`
  ).toEqual([])
}

/**
 * Waits until at least one SPFx web part has mounted. PP365 uses both page kinds: Home.aspx is a
 * canvas page (control zones), while Porteføljeoversikt, Prosjekttidslinje, Nytteoversikt and the
 * like are single web part app pages with no canvas markup, so `data-sp-web-part-id` is the one
 * marker both kinds share. Application customizers render outside it; assert on their own elements.
 */
export async function expectCanvasRendered(page: Page): Promise<void> {
  await expect(page.locator(WEB_PART).first()).toBeVisible({ timeout: 60_000 })
}

/** Finds a mounted web part by text it renders (its WebPartTitle heading, for example). */
export function webPart(page: Page, title: string | RegExp) {
  return page.locator(WEB_PART).filter({ hasText: title })
}

/**
 * Finds a mounted PP365 web part by its component alias, using the `data-sp-feature-tag`
 * SharePoint stamps on every web part container ("ProjectPhasesWebPart web part (Fasevelger)").
 * Independent of language and of whether the web part renders any text of its own.
 */
export function webPartByAlias(page: Page, alias: string) {
  return page.locator(`[data-sp-feature-tag*="${alias}"]`)
}
