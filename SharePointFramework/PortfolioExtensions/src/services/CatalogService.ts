import { dateAdd, getHashCode, PnPClientStorage } from '@pnp/core'
import { Logger, LogLevel } from '@pnp/logging'
import { IChangelogEntry, ICatalog } from 'models'
import { sampleCatalog } from './sampleCatalog'

/**
 * Default location of the central catalog (hosting repo, `main` branch). Can
 * be overridden by the `catalogUrl` command-set property.
 */
export const DEFAULT_CATALOG_URL =
  'https://raw.githubusercontent.com/Puzzlepart/prosjektportalen-hosting/main/catalog.json'

const CACHE_PREFIX = 'pp_template_catalog_'
const CACHE_HOURS = 24

/**
 * Result of loading the catalog.
 */
export interface ICatalogResult {
  catalog: ICatalog
  /**
   * True when the live catalog could not be loaded and the committed sample
   * fixture is being served instead.
   */
  degraded: boolean
  /**
   * Error message when {@link degraded} is true.
   */
  error?: string
}

/**
 * Loads and caches the central package catalog (`catalog.json`) and parses
 * package changelogs. Stateless — all data comes from `window.fetch`.
 */
export class CatalogService {
  /**
   * Load the catalog from `catalogUrl` (or {@link DEFAULT_CATALOG_URL}).
   *
   * - Served from a 24h `localStorage` cache keyed by the URL when available.
   * - Falls back to the committed {@link sampleCatalog} (with
   *   `degraded: true`) on CORS/network/parse errors.
   */
  public static async getCatalog(catalogUrl?: string): Promise<ICatalogResult> {
    const url = (catalogUrl && catalogUrl.trim()) || DEFAULT_CATALOG_URL
    const cacheKey = `${CACHE_PREFIX}${getHashCode(url.toLowerCase())}`
    const store = new PnPClientStorage().local
    const cached = store.get<ICatalog>(cacheKey)
    if (cached) {
      return { catalog: cached, degraded: false }
    }
    try {
      const catalog = await CatalogService._fetchCatalog(url)
      store.put(cacheKey, catalog, dateAdd(new Date(), 'hour', CACHE_HOURS))
      return { catalog, degraded: false }
    } catch (error) {
      Logger.log({
        message: `(CatalogService) getCatalog: falling back to sample catalog - ${error?.message}`,
        level: LogLevel.Warning
      })
      return { catalog: sampleCatalog, degraded: true, error: error?.message }
    }
  }

  /**
   * Fetch and parse a package `CHANGELOG.md` into version entries (newest
   * first, as written). Returns an empty array on any failure.
   */
  public static async getChangelog(changelogUrl?: string): Promise<IChangelogEntry[]> {
    if (!changelogUrl) return []
    try {
      const response = await fetch(changelogUrl, { method: 'GET' })
      if (!response.ok) return []
      return CatalogService._parseChangelog(await response.text())
    } catch (error) {
      Logger.log({
        message: `(CatalogService) getChangelog failed: ${error?.message}`,
        level: LogLevel.Info
      })
      return []
    }
  }

  private static async _fetchCatalog(url: string): Promise<ICatalog> {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }
    let json: ICatalog
    try {
      json = (await response.json()) as ICatalog
    } catch {
      throw new Error('Catalog response was not valid JSON')
    }
    if (!json || !Array.isArray(json.packages)) {
      throw new Error('Catalog is missing the packages array')
    }
    return json
  }

  private static _parseChangelog(markdown: string): IChangelogEntry[] {
    const entries: IChangelogEntry[] = []
    const headingRegex = /^##\s*\[?v?([0-9][0-9A-Za-z.\-+]*)\]?\s*-?\s*(.*)$/
    const bulletRegex = /^\s*[-*]\s+(.*)$/
    let current: IChangelogEntry | undefined
    for (const line of markdown.split(/\r?\n/)) {
      const heading = headingRegex.exec(line)
      if (heading) {
        if (current) entries.push(current)
        const date = heading[2]?.trim()
        current = { version: heading[1], date: date ? date : undefined, notes: [] }
        continue
      }
      const bullet = bulletRegex.exec(line)
      if (current && bullet) {
        current.notes.push(bullet[1].trim())
      }
    }
    if (current) entries.push(current)
    return entries
  }
}
