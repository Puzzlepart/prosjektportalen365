import { createHash } from 'crypto'
import { ITelemetryBatch, USAGE_TELEMETRY_URL } from '../contract'
import { CATALOG_TELEMETRY_KEY, USAGE_STATISTICS_LEVEL_KEY } from '../gate'
import { getTelemetryStore, ITelemetryPortal, ITelemetryStore, TELEMETRY_STORE_KEY } from '../store'
import { ITelemetryInit, startTelemetry } from '../track'
import { TelemetryUsageSnapshot } from '../validate'

/**
 * What the telemetry tests share: a page on a hub and on a project of it, a stand-in for the hub's
 * `PortalDataService`, and a test bed that gives each test an empty window (no store, no
 * listeners), a clock, a `fetch` and a `crypto` it controls. No test imports `@pnp/*`.
 *
 * The solutions' tests of what a component counts use it too, by path
 * (`pp365-shared-library/lib/telemetry/__fixtures__/testFixtures`): `startTestTelemetry` before
 * each test (or `clearTestTelemetry`, for a web part or an extension that starts telemetry
 * itself, on a context with the parts `spfxTestContext` gives), and `countedTelemetry` to read back
 * what was counted. A test of what is sent (the Footer's heartbeat) takes the test bed, and reads
 * its `batches`.
 *
 * It calls Jest, so it lives in `__fixtures__`: the folder is left out of the coverage figures and
 * of the published package (`.npmignore`).
 */
export const HOST = 'contoso.sharepoint.com'
export const TENANT_ID = '9a5c0f3e-1b2d-4c6e-8f70-1a2b3c4d5e6f'
export const HUB_URL = 'https://contoso.sharepoint.com/sites/prosjektportalen'
export const HUB_SITE_ID = '5c7d2f6a-3b1e-4d8c-9a0f-6e2b1c4d7f80'
export const PROJECT_SITE_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
export const PROJECT_URL = 'https://contoso.sharepoint.com/sites/frisbee'
export const OTHER_HUB_SITE_ID = 'd4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f70'
export const OTHER_HUB_URL = 'https://contoso.sharepoint.com/sites/annenportal'

/** 12 November 2026, 10:00 in Oslo. */
export const START_TIME = Date.UTC(2026, 10, 12, 9, 0, 0)

/** A page on the hub site itself, as a bundle reports it. */
export function hubPage(overrides: Partial<ITelemetryInit> = {}): ITelemetryInit {
  return {
    host: HOST,
    tenantId: TENANT_ID,
    siteId: HUB_SITE_ID,
    hubSiteId: HUB_SITE_ID,
    isHubPage: true,
    appVersion: '1.15.0',
    isDebug: false,
    ...overrides
  }
}

/** A page on a project site of the hub. */
export function projectPage(overrides: Partial<ITelemetryInit> = {}): ITelemetryInit {
  return hubPage({ siteId: PROJECT_SITE_ID, isHubPage: false, ...overrides })
}

/**
 * The hub's global settings as `getGlobalSettings` gives them: enabled rows only.
 *
 * @param level The value of `UsageStatisticsLevel`, or `undefined` for no such row
 * @param catalog The value of `CatalogTelemetryEnabled`, which the template seeds as `1`, or
 * `false` for no such row
 */
export function settingsMap(level?: string, catalog: string | false = '1'): Map<string, string> {
  const settings = new Map<string, string>([['ShowFooter', '1']])
  if (level !== undefined) settings.set(USAGE_STATISTICS_LEVEL_KEY, level)
  if (catalog !== false) settings.set(CATALOG_TELEMETRY_KEY, catalog)
  return settings
}

/** The hub's installation facts the stand-in portal's `getUsageSnapshot` resolves to. */
export const HUB_SNAPSHOT: TelemetryUsageSnapshot = {
  channel: 'main',
  templateVersion: '1.15.0',
  projects: 12,
  programs: 2,
  parentProjects: 3
}

/**
 * The stand-in for the hub's `PortalDataService`: the reads telemetry makes through it, as mocks
 * a test may give any answer.
 */
export type HubPortalStandIn = Pick<ITelemetryPortal, 'isAvailable' | 'hubSiteId' | 'url'> & {
  getGlobalSettings: jest.Mock
  getUsageSnapshot: jest.Mock
  /** Not read by telemetry itself: a bundle registers it as a site type resolver. */
  getSiteKind: jest.Mock
}

/**
 * A stand-in for the hub's `PortalDataService`: `getGlobalSettings` resolves to the map,
 * `getUsageSnapshot` to `HUB_SNAPSHOT` and `getSiteKind` to `project`.
 */
export function hubPortal(
  settings: Map<string, string> = settingsMap('2'),
  overrides: Partial<HubPortalStandIn> = {}
): HubPortalStandIn {
  return {
    isAvailable: true,
    hubSiteId: HUB_SITE_ID,
    url: HUB_URL,
    getGlobalSettings: jest.fn(() => Promise.resolve(settings)),
    getUsageSnapshot: jest.fn(() => Promise.resolve({ ...HUB_SNAPSHOT })),
    getSiteKind: jest.fn(() => Promise.resolve('project')),
    ...overrides
  } as HubPortalStandIn
}

/** The page an SPFx component's context is made for in a test. */
export interface ISpfxTestContextOptions {
  /** Which site the page is on: the hub (the default) or a project of it */
  page?: 'hub' | 'project'
  /** The component's alias in its manifest; the Footer's by default */
  alias?: string
  /** Whether the user has the permission the component asks the web for, such as managing it */
  canManageWeb?: boolean
}

/**
 * The parts of an SPFx component's context that telemetry reads (`telemetryInitFromContext`), for
 * a page on the hub or on a project of it, with what the Footer reads beside them: the web's
 * language (Norwegian Bokmål) and the user's permissions on the web. A test of a web part or an
 * extension that starts telemetry in its own `onInit` spreads them into the context its fixtures
 * build: on a context without a site id and a hub id that are GUIDs, nothing is counted.
 *
 * @param options The page, the component's alias and the user's permission
 */
export function spfxTestContext(options: ISpfxTestContextOptions = {}) {
  const { page = 'hub', alias = 'Footer', canManageWeb = false } = options
  const siteId = page === 'hub' ? HUB_SITE_ID : PROJECT_SITE_ID
  const absoluteUrl = page === 'hub' ? HUB_URL : PROJECT_URL
  return {
    pageContext: {
      web: { absoluteUrl, language: 1044, permissions: { hasPermission: () => canManageWeb } },
      site: { absoluteUrl, id: { toString: () => siteId } },
      legacyPageContext: { aadTenantId: TENANT_ID, siteId: `{${siteId}}`, hubSiteId: HUB_SITE_ID }
    },
    manifest: { alias, version: '1.15.0' }
  }
}

/** Lets the promises telemetry started (the settings read, a site type, a site hash) settle. */
export function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** The window's telemetry store, as the module left it. */
export function telemetryStore(): ITelemetryStore | undefined {
  return (window as unknown as Record<string, ITelemetryStore>)[TELEMETRY_STORE_KEY]
}

/**
 * Removes the window's telemetry store, so that what a test counts starts from nothing. Enough by
 * itself for a test of a web part or an extension, which starts telemetry in its own `onInit`.
 * Call it in `beforeEach`.
 */
export function clearTestTelemetry(): void {
  delete (window as unknown as Record<string, unknown>)[TELEMETRY_STORE_KEY]
}

/**
 * Starts telemetry for a test of what a component counts: on a window without a store, as a
 * bundle does on a project page of the hub. No portal is attached, so everything counted stays in
 * memory, where `countedTelemetry` reads it, and nothing is sent. Lighter than the test bed, which
 * also takes over the clock, `fetch` and `crypto`. Call it in `beforeEach`.
 *
 * @param init The page, when it is not a project page of the hub
 */
export function startTestTelemetry(init: ITelemetryInit = projectPage()): void {
  clearTestTelemetry()
  startTelemetry(init)
}

/** What has been counted, each kind by name with its count. */
export interface ICountedTelemetry {
  /** By `<component> <event>`, followed by the variant when the event was counted with one. */
  usage: Record<string, number>
  /** By `<component> <code>`, followed by the HTTP status when the error had one. */
  errors: Record<string, number>
  /** By `<component> <metric>`: how many durations were counted, whatever their bucket. */
  timings: Record<string, number>
}

/** A counter's name in `countedTelemetry`: its parts that are set, with a space between them. */
function counterName(parts: unknown[]): string {
  return parts.filter((part) => part !== undefined).join(' ')
}

/** Adds a count to the name's sum. */
function addCount(counts: Record<string, number>, name: string, count: number): void {
  counts[name] = (counts[name] ?? 0) + count
}

/**
 * What the window's store has counted, by name, for a test to compare with what it expects:
 * `expect(countedTelemetry().usage).toEqual({ 'ProjectStatusWebPart statusReport.deleted': 1 })`.
 * Only what the contract allows is there, so an event counted for the wrong component is missing.
 * The store counts usage per site: the same event counted on two sites is summed under its name.
 */
export function countedTelemetry(): ICountedTelemetry {
  const { usage, errors, timings } = getTelemetryStore(true)
  const counted: ICountedTelemetry = { usage: {}, errors: {}, timings: {} }
  Object.keys(usage).forEach((key) => {
    const { c, e, v, n } = usage[key]
    addCount(counted.usage, counterName([c, e, v]), n)
  })
  Object.keys(errors).forEach((key) => {
    const { c, code, http, n } = errors[key]
    addCount(counted.errors, counterName([c, code, http]), n)
  })
  Object.keys(timings).forEach((key) => {
    const { c, m, h } = timings[key]
    const count = h.reduce((sum, bucket) => sum + bucket, 0)
    addCount(counted.timings, counterName([c, m]), count)
  })
  return counted
}

/** A deterministic stand-in for SHA-256: 32 bytes that differ when the text does. */
function fakeDigest(text: string): number[] {
  const bytes: number[] = []
  let state = 7
  for (let index = 0; index < 32; index++) {
    for (let position = 0; position < text.length; position++) {
      state = (state * 31 + text.charCodeAt(position) + index) % 65521
    }
    bytes.push(state % 256)
  }
  return bytes
}

/**
 * SHA-256 as Node computes it, for `stubCrypto({ digest })`: jsdom has no `crypto.subtle`. For a
 * test of the hash itself, or of many sites, whose hashes the stand-in digest does not keep apart.
 */
export function sha256(text: string): number[] {
  const bytes: number[] = []
  createHash('sha256')
    .update(text)
    .digest()
    .forEach((byte) => bytes.push(byte))
  return bytes
}

/** What a test controls in its window. */
export interface ITelemetryTestBed {
  /** The window's `fetch`, which resolves to a 204. */
  fetch: jest.Mock
  /** The batches posted so far. */
  batches(): ITelemetryBatch[]
  /** Moves the clock forward. */
  advance(milliseconds: number): void
  /** Hides the tab: `visibilitychange` to hidden. */
  hide(): void
  /** Shows the tab again: `visibilitychange` to visible. */
  show(): void
  /** Leaves the page: `pagehide`. */
  leave(): void
  /** Moves the window to another page, as `navigateTestPage` does, until the test ends. */
  navigate(path: string): void
  /** Replaces the digest and the batch ids of the window's `crypto`. */
  stubCrypto(stub: { digest?: (text: string) => number[]; randomUUID?: () => string }): void
  /** Removes `crypto.subtle`, as on a page that is not served over https. */
  removeSubtleCrypto(): void
  /** Sets a property on `navigator`, such as `globalPrivacyControl`, until the test ends. */
  setNavigator(name: string, value: unknown): void
  /**
   * Puts the window back as it was: no store, none of telemetry's listeners, the real clock and
   * `crypto`, and the address it had. Listeners other code registered meanwhile are left alone.
   */
  restore(): void
}

/** The third argument of `addEventListener` and `removeEventListener`. */
type ListenerOptions = boolean | AddEventListenerOptions | undefined

/**
 * Moves the window to another address of its origin without loading anything, as SharePoint's
 * navigation between pages does. Telemetry tells one page from the next by the path of the
 * address (`trackPageView`). A test that navigates without the test bed puts the address back
 * itself.
 *
 * @param path The path of the page, such as `/sites/frisbee/SitePages/Home.aspx`
 */
export function navigateTestPage(path: string): void {
  window.history.pushState({}, '', path)
}

/**
 * Gives a test an empty window and control of its clock, `fetch`, `crypto` and events. Call it in
 * `beforeEach` and its `restore` in `afterEach`.
 */
export function telemetryTestBed(): ITelemetryTestBed {
  const scope = globalThis as any
  let now = START_TIME
  let visibility = 'visible'
  let batchCount = 0
  const listeners: Array<
    [EventTarget, string, EventListenerOrEventListenerObject, ListenerOptions]
  > = []
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(scope, 'crypto')
  const { pathname, search, hash } = window.location
  const navigatorNames: string[] = []
  let digest = fakeDigest
  const crypto = {
    subtle: {
      digest: jest.fn((_algorithm: string, data: Uint8Array) => {
        let text = ''
        data.forEach((code) => (text += String.fromCharCode(code)))
        return Promise.resolve(new Uint8Array(digest(text)).buffer)
      })
    },
    randomUUID: jest.fn(() => `00000000-0000-4000-8000-${String(++batchCount).padStart(12, '0')}`)
  }

  delete scope[TELEMETRY_STORE_KEY]
  jest.spyOn(Date, 'now').mockImplementation(() => now)
  // Every listener is registered as it was asked for, options included. Only telemetry's own two
  // are taken away again by `restore`: what React or Fluent registers while a test runs stays.
  const flushEvents: Array<[EventTarget, string]> = [
    [document, 'visibilitychange'],
    [window, 'pagehide']
  ]
  flushEvents.forEach(([target, flushEvent]) => {
    const add = target.addEventListener.bind(target)
    const spy: jest.SpyInstance = jest.spyOn(target, 'addEventListener')
    spy.mockImplementation(
      (type: string, listener: EventListenerOrEventListenerObject, options?: ListenerOptions) => {
        if (type === flushEvent) listeners.push([target, type, listener, options])
        add(type, listener, options)
      }
    )
  })
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => visibility
  })
  Object.defineProperty(scope, 'crypto', { configurable: true, value: crypto })
  const fetch = jest.fn((_url: string, _options: RequestInit) => Promise.resolve({ status: 204 }))
  scope.fetch = fetch

  const changeVisibility = (state: string): void => {
    visibility = state
    document.dispatchEvent(new Event('visibilitychange'))
  }

  return {
    fetch,
    // Only what went to the usage endpoint: a component under test may call `fetch` itself.
    batches: () =>
      fetch.mock.calls
        .filter(([url]) => url === USAGE_TELEMETRY_URL)
        .map(([, options]) => JSON.parse(options.body as string)),
    advance: (milliseconds) => {
      now += milliseconds
    },
    hide: () => changeVisibility('hidden'),
    show: () => changeVisibility('visible'),
    leave: () => {
      window.dispatchEvent(new Event('pagehide'))
    },
    navigate: navigateTestPage,
    stubCrypto: (stub) => {
      if (stub.digest) digest = stub.digest
      if (stub.randomUUID) crypto.randomUUID.mockImplementation(stub.randomUUID)
    },
    removeSubtleCrypto: () => {
      delete crypto.subtle
    },
    setNavigator: (name, value) => {
      navigatorNames.push(name)
      Object.defineProperty(navigator, name, { configurable: true, value })
    },
    restore: () => {
      listeners.forEach(([target, type, listener, options]) =>
        target.removeEventListener(type, listener, options)
      )
      navigatorNames.forEach((name) => delete (navigator as any)[name])
      delete (document as any).visibilityState
      delete scope.fetch
      delete scope.crypto
      if (cryptoDescriptor) Object.defineProperty(scope, 'crypto', cryptoDescriptor)
      delete scope[TELEMETRY_STORE_KEY]
      navigateTestPage(`${pathname}${search}${hash}`)
      jest.restoreAllMocks()
      window.sessionStorage.clear()
    }
  }
}
