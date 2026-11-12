import * as fs from 'fs'
import * as path from 'path'
import {
  GATE_MAX_AGE_MS,
  MAX_BATCH_BYTES,
  MAX_ENTRY_COUNT,
  MAX_ERROR_ENTRIES,
  MAX_SENDS_PER_WINDOW,
  MAX_SITE_ENTRIES,
  MAX_TIMING_ENTRIES,
  MAX_USAGE_ENTRIES,
  MIN_SEND_INTERVAL_MS,
  TELEMETRY_COMPONENTS,
  TELEMETRY_ERROR_CODES,
  TELEMETRY_EVENTS,
  TELEMETRY_EXTENSIONS,
  TELEMETRY_FIELDS,
  TELEMETRY_HTTP_STATUSES,
  TELEMETRY_LEVELS,
  TELEMETRY_PATTERNS,
  TELEMETRY_RESERVED_TIMING_METRICS,
  TELEMETRY_SCHEMA,
  TELEMETRY_SITE_TYPES,
  TELEMETRY_TIMING_BUCKETS,
  TELEMETRY_TIMING_METRICS,
  TELEMETRY_WEB_PARTS,
  USAGE_TELEMETRY_URL
} from './contract'

/** The repository root, from `lib-commonjs/telemetry`, where the compiled test runs. */
const REPO_ROOT = path.resolve(__dirname, '../../../..')

/** The aliases of every component in the main channel, by solution. */
function channelAliases(): Record<string, string[]> {
  const channel = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'channels/main.json'), 'utf8'))
  const aliases: Record<string, string[]> = {}
  Object.keys(channel.spfx.solutions).forEach((solution) => {
    aliases[solution] = Object.keys(channel.spfx.solutions[solution].components)
  })
  return aliases
}

const events = Object.keys(TELEMETRY_EVENTS) as Array<keyof typeof TELEMETRY_EVENTS>

/**
 * The contract is what may leave the tenant. Its component list must follow the components the
 * solutions really have, and every event must name components and a release.
 */
describe('the usage statistics contract', () => {
  it('names every component of the main channel, except ProjectUpgrade and the library', () => {
    const aliases = channelAliases()
    const all = Object.keys(aliases).reduce<string[]>((list, key) => list.concat(aliases[key]), [])
    expect(all).toHaveLength(30)
    const expected = all.filter((alias) => alias !== 'ProjectUpgrade' && alias !== 'SharedLibrary')
    expect([...TELEMETRY_COMPONENTS].sort()).toEqual(expected.sort())
    expect(TELEMETRY_COMPONENTS).toHaveLength(28)
    expect(TELEMETRY_COMPONENTS).toContain('ProgramAdministrationWebpart')
  })

  it('lists the web parts of the three web part solutions, and the extensions of the other two', () => {
    const aliases = channelAliases()
    const webParts = [
      ...aliases.PortfolioWebParts,
      ...aliases.ProgramWebParts,
      ...aliases.ProjectWebParts
    ]
    expect([...TELEMETRY_WEB_PARTS].sort()).toEqual(webParts.sort())
    expect(TELEMETRY_WEB_PARTS).toHaveLength(20)
    const extensions = [...aliases.PortfolioExtensions, ...aliases.ProjectExtensions].filter(
      (alias) => alias !== 'ProjectUpgrade'
    )
    expect([...TELEMETRY_EXTENSIONS].sort()).toEqual(extensions.sort())
  })

  it('lets every event be counted by known components only, without repeats', () => {
    events.forEach((event) => {
      const components: readonly string[] = TELEMETRY_EVENTS[event].components
      expect(components.length).toBeGreaterThan(0)
      expect(new Set(components).size).toBe(components.length)
      components.forEach((component) => expect(TELEMETRY_COMPONENTS).toContain(component))
    })
  })

  it('has the events of the plan, each in a release', () => {
    expect(events.sort()).toEqual(
      [
        'assistant.opened',
        'catalog.opened',
        'childProjects.added',
        'childProjects.removed',
        'dataSource.switched',
        'documentTemplates.copied',
        'excel.exported',
        'help.opened',
        'idea.decided',
        'idea.projectDataCreated',
        'idea.recommended',
        'layout.toggled',
        'loaded',
        'news.created',
        'page.viewed',
        'phase.changed',
        'portfolio.switched',
        'postAction.toggled',
        'properties.edited',
        'riskAction.created',
        'setup.aborted',
        'setup.completed',
        'setup.failed',
        'statusReport.created',
        'statusReport.deleted',
        'statusReport.edited',
        'statusReport.published',
        'tab.switched',
        'timelineItem.opened',
        'view.saved',
        'view.switched',
        'viewAll.toggled'
      ].sort()
    )
    events.forEach((event) => expect(TELEMETRY_EVENTS[event].since).toBe('1.15.0'))
  })

  it('counts the load of every web part, and of nothing else', () => {
    expect(TELEMETRY_EVENTS.loaded.components).toEqual(TELEMETRY_WEB_PARTS)
  })

  it('gives variants to the setup and the idea events only', () => {
    const withVariants = events.filter((event) => TELEMETRY_EVENTS[event].variants.length > 0)
    expect(withVariants.sort()).toEqual(['idea.decided', 'idea.recommended', 'setup.completed'])
    expect(TELEMETRY_EVENTS['setup.completed'].variants).toEqual(['new', 'rerun', 'parent'])
    const decisions = ['approve', 'consider', 'reject', 'other']
    expect(TELEMETRY_EVENTS['idea.recommended'].variants).toEqual(decisions)
    expect(TELEMETRY_EVENTS['idea.decided'].variants).toEqual(decisions)
  })

  it('holds no value that could carry a URL, an address or free text', () => {
    const values: string[] = [
      ...TELEMETRY_COMPONENTS,
      ...TELEMETRY_SITE_TYPES,
      ...TELEMETRY_ERROR_CODES,
      ...TELEMETRY_TIMING_METRICS,
      ...TELEMETRY_RESERVED_TIMING_METRICS,
      ...events
    ]
    events.forEach((event) => values.push(...TELEMETRY_EVENTS[event].variants))
    values.forEach((value) => expect(value).toMatch(/^[A-Za-z][A-Za-z._]{1,39}$/))
  })

  it('has the levels, site types, error codes, statuses and metrics of the plan', () => {
    expect(TELEMETRY_SCHEMA).toBe(1)
    expect(USAGE_TELEMETRY_URL).toBe('https://assist.prosjektportalen.no/api/telemetry/usage')
    expect(TELEMETRY_LEVELS).toEqual([0, 1, 2, 3])
    expect(TELEMETRY_SITE_TYPES).toEqual(['hub', 'project', 'program', 'parent', 'other'])
    expect(TELEMETRY_ERROR_CODES).toEqual([
      'permission_denied',
      'not_found',
      'throttled',
      'server_error',
      'timeout',
      'network',
      'render_failed',
      'provisioning_failed',
      'unknown'
    ])
    expect(TELEMETRY_HTTP_STATUSES).toEqual([
      0, 400, 401, 403, 404, 409, 412, 429, 500, 502, 503, 504
    ])
    expect(TELEMETRY_TIMING_METRICS).toEqual(['init'])
    expect(TELEMETRY_RESERVED_TIMING_METRICS).toEqual(['firstRender', 'dataLoad'])
    expect(TELEMETRY_TIMING_BUCKETS).toEqual([0, 250, 500, 1000, 2000, 4000, 8000])
  })

  it('has the limits of the plan', () => {
    expect(MAX_BATCH_BYTES).toBe(15000)
    expect(MIN_SEND_INTERVAL_MS).toBe(60 * 1000)
    expect(MAX_SENDS_PER_WINDOW).toBe(500)
    expect(GATE_MAX_AGE_MS).toBe(60 * 60 * 1000)
    expect(MAX_USAGE_ENTRIES).toBe(200)
    expect(MAX_ERROR_ENTRIES).toBe(100)
    expect(MAX_TIMING_ENTRIES).toBe(100)
    expect(MAX_SITE_ENTRIES).toBe(50)
    expect(MAX_ENTRY_COUNT).toBe(10000)
  })

  it('names the fields of a batch, and its patterns are valid', () => {
    expect(TELEMETRY_FIELDS.envelope).toEqual([
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
    ])
    expect(TELEMETRY_FIELDS.usage).toEqual(['c', 'e', 's', 'v', 'n'])
    expect(TELEMETRY_FIELDS.sites).toEqual(['h', 's'])
    expect(TELEMETRY_FIELDS.errors).toEqual(['c', 'code', 'http', 'n'])
    expect(TELEMETRY_FIELDS.timings).toEqual(['c', 'm', 'h'])
    expect(TELEMETRY_PATTERNS.host.test('contoso.sharepoint.com')).toBe(true)
    expect(TELEMETRY_PATTERNS.host.test('contoso.sharepoint.com.evil.example')).toBe(false)
    expect(TELEMETRY_PATTERNS.version.test('1.15.0')).toBe(true)
    expect(TELEMETRY_PATTERNS.siteHash.test('3f9a0c1d2e4b5a69')).toBe(true)
    expect(TELEMETRY_PATTERNS.hubPath.test('/sites/prosjektportalen')).toBe(true)
    expect(TELEMETRY_PATTERNS.hubPath.test('/sites/a/SitePages/Home.aspx')).toBe(false)
  })

  it('is data only: the file imports nothing, so Assist can keep a copy of it', () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, 'SharePointFramework/shared-library/src/telemetry/contract.ts'),
      'utf8'
    )
    expect(source).not.toMatch(/^\s*import\s/m)
    expect(source).not.toMatch(/\brequire\(/)
  })
})
