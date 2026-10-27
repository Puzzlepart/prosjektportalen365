import { Browser, BrowserContext, devices, Page, test, TestInfo } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { baseURL, STORAGE_STATE } from '../../playwright.config'
import { documentLibrary } from '../fixtures/document-template-dialog'
import { configuredUrl, withNetworkRetry } from '../fixtures/pp365'
import { restGet } from '../fixtures/rest'

/**
 * How often the footer gets no bottom placeholder on a list page, for SharePoint/sp-dev-docs#11070,
 * with the logs Microsoft asked for. A custom list on the hub and the project's document library
 * are loaded again and again: in one browser context, a warm cache like new tabs of one signed-in
 * browser, and in a fresh context for each load, a cold cache. The footer's placeholder trace is on
 * (`pp365.debug.placeholders`, PortfolioExtensions' `src/extensions/footer/placeholderTrace.ts`).
 * Each load records whether the footer showed, whether SharePoint logged its own «Defined
 * clientSidePlaceholders», the footer's trace, page errors (the React fault of #11068) and the list
 * view host scripts that came. The results go to `e2e/placeholder-diagnostics/<time>/`, sanitized:
 * `summary.md`, each page and cache's loads as JSON, and in `logs/` the console of each load
 * without the footer and of the first load with it.
 *
 * It asserts nothing about the footer, and runs only when asked for (E2E_PLACEHOLDER_DIAGNOSTICS=1,
 * see `playwright.config.ts`). `PLACEHOLDER_LOADS` sets the loads per page and cache (20),
 * `PLACEHOLDER_WAIT_MS` how long a load waits for the footer (20 000), and `PLACEHOLDER_HUB_LIST`
 * the hub list's title (Prosjekter or Projects, else the hub's first custom list).
 */

const LOADS = Number(process.env.PLACEHOLDER_LOADS) || 20
const WAIT_MS = Number(process.env.PLACEHOLDER_WAIT_MS) || 20_000
/** After the footer shows, for the trace's last lines, such as the navigation event. */
const SETTLE_MS = 2_000
const TRACE_KEY = 'pp365.debug.placeholders'
const TRACE_PREFIX = '[pp365 placeholders]'
const SHAREPOINT_PLACEHOLDERS_LINE = /Defined clientSidePlaceholders/i
const REACT_FAULT = /Cannot read properties of null \(reading 'useContext'\)/
const LIST_VIEW_HOST = /listview-host-assembly[^/?#]*\.js/i
/** A button of the footer: in a list page's bottom placeholder, or in the one of other pages. */
const FOOTER_BUTTON = '[data-sp-placeholder="Bottom"] button, #spBottomPlaceholder button'
const OUTPUT = path.join(
  __dirname,
  '..',
  '..',
  'placeholder-diagnostics',
  new Date().toISOString().replace(/[:.]/g, '-')
)

const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const programUrl = configuredUrl(process.env.E2E_PROGRAM_URL)

/** One line of the footer's trace. */
interface TraceLine {
  step: string
  ms: number
  placeholderNames: string[]
  bottomElement: boolean
  acquired?: boolean
}

/** What one load showed. */
interface Load {
  load: number
  footerShown: boolean
  sharePointDefinedPlaceholders: boolean
  /** The footer's last attempt to take the bottom placeholder; null when no trace came. */
  acquired: boolean | null
  changedEvents: number
  navigatedEvents: number
  reactFault: boolean
  /** The list view host scripts that came, by file name, in order. */
  listViewHosts: string[]
  trace: TraceLine[]
  /** The console, page errors included, as `<type>: <text>`. */
  console: string[]
}

/** The loads of one page with one kind of cache. */
interface Group {
  target: string
  cache: 'warm' | 'cold'
  loads: Load[]
}

const groups: Group[] = []

/** Escapes a text for a regular expression. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Takes out what identifies the tenant and the test user, as Microsoft asked: tokens, e-mail
 * addresses, the sites' paths and the tenant's name.
 */
const sanitize = (() => {
  const tenant = new URL(baseURL).hostname.split('.')[0]
  const sites: Array<[string, string]> = [
    [new URL(baseURL).pathname.replace(/\/+$/, ''), '/sites/hub'],
    ...(projectUrl ? [[new URL(projectUrl).pathname, '/sites/project'] as [string, string]] : []),
    ...(programUrl ? [[new URL(programUrl).pathname, '/sites/program'] as [string, string]] : [])
  ]
  const rules: Array<[RegExp, string]> = [
    [/(Bearer\s+)[\w\-.~+/]+=*/gi, '$1<redacted>'],
    [/((?:access_token|id_token|code)=)[^&\s"']+/gi, '$1<redacted>'],
    [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, 'user@contoso.onmicrosoft.com'],
    ...sites.flatMap(([from, to]): Array<[RegExp, string]> => [
      [new RegExp(escapeRegExp(from), 'gi'), to],
      [new RegExp(escapeRegExp(encodeURIComponent(from)), 'gi'), encodeURIComponent(to)]
    ]),
    [new RegExp(escapeRegExp(tenant), 'gi'), 'contoso']
  ]
  return (text: string) =>
    rules.reduce((out, [pattern, replacement]) => out.replace(pattern, replacement), text)
})()

/** A custom list on the hub, by REST: PLACEHOLDER_HUB_LIST, else Prosjekter or Projects, else the first. */
async function hubList(page: Page) {
  const site = baseURL.replace(/\/+$/, '')
  const response = await restGet(
    page,
    `${site}/_api/web/lists?$filter=BaseTemplate eq 100 and Hidden eq false&$select=Title,DefaultViewUrl&$top=100`
  )
  if (!response.ok()) {
    throw new Error(`Could not list the lists of ${site}: HTTP ${response.status()}`)
  }
  const lists = ((await response.json()) as { value: { Title: string; DefaultViewUrl: string }[] })
    .value
  const list =
    lists.find((l) => l.Title === process.env.PLACEHOLDER_HUB_LIST) ??
    lists.find((l) => /^(Prosjekter|Projects)$/i.test(l.Title)) ??
    lists[0]
  if (!list) throw new Error(`${site} has no custom list`)
  return { title: list.Title, url: `${new URL(site).origin}${list.DefaultViewUrl}` }
}

/** A context signed in as the test user, with the footer's trace on in every page it opens. */
async function newContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    storageState: STORAGE_STATE,
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo'
  })
  await context.addInitScript((key) => {
    try {
      window.sessionStorage.setItem(key, '1')
    } catch {
      // A storage the browser refuses leaves the trace off; the load then has none.
    }
  }, TRACE_KEY)
  return context
}

/** Loads the page in a new tab of the context, and records what came. */
async function loadOnce(context: BrowserContext, url: string, n: number): Promise<Load> {
  const page = await context.newPage()
  const record: Load = {
    load: n,
    footerShown: false,
    sharePointDefinedPlaceholders: false,
    acquired: null,
    changedEvents: 0,
    navigatedEvents: 0,
    reactFault: false,
    listViewHosts: [],
    trace: [],
    console: []
  }
  page.on('console', (message) => {
    const text = message.text()
    record.console.push(`${message.type()}: ${sanitize(text)}`)
    if (SHAREPOINT_PLACEHOLDERS_LINE.test(text)) record.sharePointDefinedPlaceholders = true
    if (text.startsWith(TRACE_PREFIX)) {
      try {
        record.trace.push(JSON.parse(text.slice(TRACE_PREFIX.length)) as TraceLine)
      } catch {
        // A line with the prefix that is no trace stays in the console only.
      }
    }
  })
  page.on('pageerror', (error) => {
    record.console.push(`pageerror: ${sanitize(error.message)}`)
    if (REACT_FAULT.test(error.message)) record.reactFault = true
  })
  page.on('response', (response) => {
    const host = LIST_VIEW_HOST.exec(response.url())
    if (host) record.listViewHosts.push(host[0])
  })
  try {
    await withNetworkRetry(() => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 }))
    record.footerShown = await page
      .locator(FOOTER_BUTTON)
      .first()
      .waitFor({ state: 'visible', timeout: WAIT_MS })
      .then(
        () => true,
        () => false
      )
    await page.waitForTimeout(SETTLE_MS)
  } finally {
    await page.close()
  }
  const acquisitions = record.trace.filter((line) => line.step === 'tryCreateContent')
  record.acquired = acquisitions.length ? !!acquisitions[acquisitions.length - 1].acquired : null
  record.changedEvents = record.trace.filter((line) => line.step === 'changedEvent').length
  record.navigatedEvents = record.trace.filter((line) => line.step === 'navigatedEvent').length
  return record
}

/** A group's name in file names: its page and cache, in lowercase words. */
function slug(group: Group): string {
  return `${group.target}-${group.cache}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** The file in `logs/` that holds a load's console. */
function logName(group: Group, load: Load): string {
  return `${slug(group)}-${String(load.load).padStart(2, '0')}.txt`
}

/** Writes a group's loads, and the console of each load without the footer and of the first with it. */
function writeGroup(group: Group) {
  fs.mkdirSync(path.join(OUTPUT, 'logs'), { recursive: true })
  fs.writeFileSync(path.join(OUTPUT, `${slug(group)}.json`), JSON.stringify(group, null, 2))
  const firstShown = group.loads.find((load) => load.footerShown)
  for (const load of group.loads) {
    if (load.footerShown && load !== firstShown) continue
    fs.writeFileSync(
      path.join(OUTPUT, 'logs', logName(group, load)),
      load.console.join('\n') + '\n'
    )
  }
}

/** How many of the loads `holds` is true of. */
function count(loads: Load[], holds: (load: Load) => boolean): number {
  return loads.filter(holds).length
}

/** The counts of every group, then each load without the footer with its trace. */
function summary(): string {
  const traced = groups.some((group) => group.loads.some((load) => load.trace.length > 0))
  const lines = [
    '# The footer on list pages (SharePoint/sp-dev-docs#11070)',
    '',
    `${new Date().toISOString()}: ${LOADS} loads per page and cache, waiting ${WAIT_MS / 1000} s for the footer.`,
    ...(traced
      ? []
      : [
          '',
          '**No line of the footer trace came: the deployed footer has no placeholder trace.**'
        ]),
    '',
    '| Page | Cache | Loads | Footer missing | SharePoint defined its placeholders | Bottom placeholder taken | A placeholder change event | React fault (#11068) | List view host twice |',
    '|---|---|---|---|---|---|---|---|---|',
    ...groups.map(
      ({ target, cache, loads }) =>
        `| ${target} | ${cache} | ${loads.length} | ${count(loads, (l) => !l.footerShown)} | ${count(loads, (l) => l.sharePointDefinedPlaceholders)} | ${count(loads, (l) => l.acquired === true)} | ${count(loads, (l) => l.changedEvents > 0)} | ${count(loads, (l) => l.reactFault)} | ${count(loads, (l) => l.listViewHosts.length > 1)} |`
    )
  ]
  for (const group of groups) {
    const firstShown = group.loads.find((load) => load.footerShown)
    lines.push('', `## ${group.target}, ${group.cache} cache`, '')
    if (firstShown) {
      lines.push(
        `For comparison, the first load with the footer: \`logs/${logName(group, firstShown)}\`.`
      )
    }
    for (const load of group.loads.filter((l) => !l.footerShown)) {
      lines.push(
        '',
        `### Load ${load.load}: no footer`,
        '',
        `SharePoint's placeholder line: ${load.sharePointDefinedPlaceholders ? 'yes' : 'no'}. React fault: ${load.reactFault ? 'yes' : 'no'}. List view host scripts: ${load.listViewHosts.join(', ') || 'none'}. Console: \`logs/${logName(group, load)}\`.`,
        '',
        '```',
        ...(load.trace.length ? load.trace.map((line) => JSON.stringify(line)) : ['(no trace)']),
        '```'
      )
    }
  }
  return lines.join('\n') + '\n'
}

/** Loads the page LOADS times with the cache, and keeps the group for the summary. */
async function measure(
  browser: Browser,
  testInfo: TestInfo,
  target: string,
  url: string,
  cache: 'warm' | 'cold'
) {
  const group: Group = { target, cache, loads: [] }
  const warm = cache === 'warm' ? await newContext(browser) : undefined
  try {
    // The warm context's first load fills its cache, and is not counted.
    if (warm) await loadOnce(warm, url, 0)
    for (let n = 1; n <= LOADS; n++) {
      const context = warm ?? (await newContext(browser))
      try {
        group.loads.push(await loadOnce(context, url, n))
      } finally {
        if (!warm) await context.close()
      }
    }
  } finally {
    await warm?.close()
  }
  groups.push(group)
  writeGroup(group)
  testInfo.annotations.push({
    type: 'footer missing',
    description: `${count(group.loads, (l) => !l.footerShown)} of ${group.loads.length} loads`
  })
}

test.describe('the footer on list pages (sp-dev-docs#11070)', () => {
  for (const cache of ['warm', 'cold'] as const) {
    test(`a custom list on the hub, ${cache} cache`, async ({ page, browser }, testInfo) => {
      test.setTimeout((LOADS + 1) * (WAIT_MS + 90_000))
      const list = await hubList(page)
      await measure(browser, testInfo, `hub list ${list.title}`, list.url, cache)
    })

    test(`the project's document library, ${cache} cache`, async ({ page, browser }, testInfo) => {
      test.skip(!projectUrl, 'E2E_PROJECT_URL is not set (or is the .env.example placeholder)')
      test.setTimeout((LOADS + 1) * (WAIT_MS + 90_000))
      const library = await documentLibrary(page, projectUrl!)
      await measure(browser, testInfo, `project library ${library.title}`, library.url, cache)
    })
  }
})

test.afterAll(() => {
  if (!groups.length) return
  fs.mkdirSync(OUTPUT, { recursive: true })
  fs.writeFileSync(path.join(OUTPUT, 'summary.md'), summary())
})
