import { dateAdd, getHashCode, PnPClientStorage } from '@pnp/core'
import { Logger, LogLevel } from '@pnp/logging'
import strings from 'PortfolioExtensionsStrings'
import {
  IChangelogEntry,
  ICatalog,
  ICatalogPackage,
  IHierarchyNode,
  IPackageContents,
  IPackageContentSummaryEntry,
  IPackageManifest
} from 'models'
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
    const cached = store.get(cacheKey) as ICatalog
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

  /**
   * Fetch and parse a package's contents (manifest + provisioning + content
   * JSON files) from the raw hosting URLs — no `.pppkg` download / install
   * required. Returns a high-level summary (icon + label + count) and a
   * drill-down hierarchy (lists, content types, site fields, term sets, …).
   *
   * Returns `undefined` if the package base URL can't be derived or the
   * manifest can't be fetched.
   */
  public static async getPackageContents(
    pkg: ICatalogPackage
  ): Promise<IPackageContents | undefined> {
    const baseUrl = CatalogService._derivePackageBaseUrl(pkg)
    if (!baseUrl) return undefined
    try {
      const manifest = await CatalogService._fetchJson<IPackageManifest>(`${baseUrl}manifest.json`)
      const [hub, template] = await Promise.all([
        manifest.provisioning?.hubTemplate
          ? CatalogService._fetchJson<any>(baseUrl + manifest.provisioning.hubTemplate).catch(
              () => undefined
            )
          : Promise.resolve(undefined),
        manifest.provisioning?.template
          ? CatalogService._fetchJson<any>(baseUrl + manifest.provisioning.template).catch(
              () => undefined
            )
          : Promise.resolve(undefined)
      ])
      const contentItems = manifest.content?.items ?? []
      const contentData = await Promise.all(
        contentItems.map((item) =>
          CatalogService._fetchJson<any>(baseUrl + item.sourceFile).catch(() => undefined)
        )
      )
      return CatalogService._buildContents(
        manifest,
        hub,
        template,
        contentItems,
        contentData,
        baseUrl
      )
    } catch (error) {
      Logger.log({
        message: `(CatalogService) getPackageContents failed: ${error?.message}`,
        level: LogLevel.Warning
      })
      return undefined
    }
  }

  /**
   * Derive the package's raw base URL (`.../packages/<dir>/`) from its
   * changelog or thumbnail URL.
   */
  private static _derivePackageBaseUrl(pkg: ICatalogPackage): string | undefined {
    const ref = pkg.changelogUrl || pkg.thumbnail
    if (!ref) return undefined
    const idx = ref.lastIndexOf('/')
    return idx >= 0 ? ref.slice(0, idx + 1) : undefined
  }

  private static async _fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
    return (await response.json()) as T
  }

  /**
   * Fetch the raw text of a package file (e.g. an extension/content JSON) for
   * the inline code preview.
   */
  public static async getFileText(url: string): Promise<string> {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
    return response.text()
  }

  private static _asArray(value: any): any[] {
    return Array.isArray(value) ? value : []
  }

  private static _entryLabel(entry: any, keys: string[]): string {
    if (typeof entry === 'string') return entry
    if (entry && typeof entry === 'object') {
      for (const key of keys) {
        if (entry[key]) return String(entry[key])
      }
    }
    return '—'
  }

  /**
   * Extract a readable label from a SiteFields entry (an XML string).
   */
  private static _fieldLabel(field: any): string {
    if (typeof field !== 'string') {
      return CatalogService._entryLabel(field, ['DisplayName', 'Name', 'InternalName'])
    }
    const displayName = /DisplayName=["']([^"']+)["']/.exec(field)
    if (displayName) return displayName[1]
    const name = /(?:InternalName|StaticName|Name)=["']([^"']+)["']/.exec(field)
    return name ? name[1] : strings.CatalogContentFieldFallback
  }

  /**
   * Build the summary + hierarchy from the parsed manifest/provisioning/content.
   */
  private static _buildContents(
    manifest: IPackageManifest,
    hub: any,
    template: any,
    contentItems: IPackageManifest['content']['items'],
    contentData: any[],
    baseUrl: string
  ): IPackageContents {
    const summary: IPackageContentSummaryEntry[] = []
    const hierarchy: IHierarchyNode[] = []

    // Standard content (one entry per content item, with element counts).
    const contentChildren: IHierarchyNode[] = []
    contentItems.forEach((item, index) => {
      const data = contentData[index]
      const count = Array.isArray(data) ? data.length : undefined
      summary.push({ key: `content-${item.id}`, label: item.name, count, icon: 'content' })
      contentChildren.push({
        key: `content-${item.id}`,
        label: item.name,
        count,
        icon: 'content',
        fileUrl: item.sourceFile ? baseUrl + item.sourceFile : undefined,
        children: Array.isArray(data)
          ? data.map((row, rowIndex) => ({
              key: `content-${item.id}-${rowIndex}`,
              label: CatalogService._entryLabel(row, ['Title', 'Name'])
            }))
          : undefined
      })
    })
    if (contentChildren.length > 0) {
      hierarchy.push({
        key: 'standard-content',
        label: strings.CatalogContentStandardContent,
        icon: 'content',
        count: contentChildren.length,
        children: contentChildren
      })
    }

    const sections: Array<{
      key: string
      summaryLabel: string
      hierarchyLabel: string
      icon: IPackageContentSummaryEntry['icon']
      entries: any[]
      labelKeys: string[]
    }> = [
      {
        key: 'lists',
        summaryLabel: strings.CatalogContentLists,
        hierarchyLabel: strings.CatalogContentLists,
        icon: 'lists',
        entries: [
          ...CatalogService._asArray(hub?.Lists),
          ...CatalogService._asArray(template?.Lists)
        ],
        labelKeys: ['Title', 'Name']
      },
      {
        key: 'content-types',
        summaryLabel: strings.CatalogContentContentTypes,
        hierarchyLabel: strings.CatalogContentContentTypes,
        icon: 'contentTypes',
        entries: [
          ...CatalogService._asArray(hub?.ContentTypes),
          ...CatalogService._asArray(template?.ContentTypes)
        ],
        labelKeys: ['Name', 'Title']
      },
      {
        key: 'site-fields',
        summaryLabel: strings.CatalogContentSiteFields,
        hierarchyLabel: strings.CatalogContentSiteFields,
        icon: 'siteFields',
        entries: [
          ...CatalogService._asArray(hub?.SiteFields),
          ...CatalogService._asArray(template?.SiteFields)
        ],
        labelKeys: []
      },
      {
        key: 'extensions',
        summaryLabel: strings.CatalogContentExtensions,
        hierarchyLabel: strings.CatalogContentExtensions,
        icon: 'extensions',
        entries: CatalogService._asArray(manifest.provisioning?.extensions),
        labelKeys: ['name', 'Name']
      },
      {
        key: 'files',
        summaryLabel: strings.CatalogContentFiles,
        hierarchyLabel: strings.CatalogContentFiles,
        icon: 'files',
        entries: [
          ...CatalogService._asArray(hub?.Files),
          ...CatalogService._asArray(template?.Files)
        ],
        labelKeys: ['Dest', 'Url', 'Src', 'Folder']
      }
    ]

    for (const section of sections) {
      if (section.entries.length === 0) continue
      summary.push({
        key: section.key,
        label: section.summaryLabel,
        count: section.entries.length,
        icon: section.icon
      })
      hierarchy.push({
        key: section.key,
        label: section.hierarchyLabel,
        icon: section.icon,
        count: section.entries.length,
        children: section.entries.map((entry, index) => ({
          key: `${section.key}-${index}`,
          label:
            section.key === 'site-fields'
              ? CatalogService._fieldLabel(entry)
              : CatalogService._entryLabel(entry, section.labelKeys),
          // Extension entries map to a single JSON file — expose it for preview.
          fileUrl: section.key === 'extensions' && entry?.file ? baseUrl + entry.file : undefined
        }))
      })
    }

    // Taxonomy (term sets → terms).
    const termSets = CatalogService._asArray(hub?.Taxonomy?.TermSets)
    if (termSets.length > 0) {
      summary.push({
        key: 'taxonomy',
        label: strings.CatalogContentTermSets,
        count: termSets.length,
        icon: 'taxonomy'
      })
      hierarchy.push({
        key: 'taxonomy',
        label: strings.CatalogContentTaxonomy,
        icon: 'taxonomy',
        count: termSets.length,
        children: termSets.map((set, index) => ({
          key: `termset-${index}`,
          label: set?.Name ?? '—',
          icon: 'termSet' as const,
          count: CatalogService._asArray(set?.Terms).length,
          children: CatalogService._asArray(set?.Terms).map((term, termIndex) => ({
            key: `term-${index}-${termIndex}`,
            label: term?.Name ?? '—',
            icon: 'term' as const
          }))
        }))
      })
    }

    return { summary, hierarchy }
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
