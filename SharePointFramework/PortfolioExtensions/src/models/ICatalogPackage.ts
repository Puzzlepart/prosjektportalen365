/**
 * Package type as defined by the hosting manifest/catalog schema.
 */
export type PackageType = 'template' | 'extension' | 'content'

/**
 * A single package entry in the central {@link ICatalog}. Mirrors the
 * `packages[]` item in `schema/catalog.schema.json`.
 *
 * The catalog deliberately does NOT carry `contentSummary`, `downloads`,
 * `recommended` or `category`. Category is derived from {@link tags}, the
 * content summary is read from the downloaded manifest, and version history
 * is fetched from {@link changelogUrl}.
 */
export interface ICatalogPackage {
  /**
   * Unique package identifier (kebab-case), matches `manifest.json` and the
   * `PpPkgId` field on the Maloppsett item once imported/registered.
   */
  id: string

  /**
   * Human-readable package name.
   */
  name: string

  /**
   * Brief description shown in the catalog and details panel.
   */
  description?: string

  /**
   * Package version (semver).
   */
  version: string

  /**
   * Package type.
   */
  type: PackageType

  /**
   * Fluent UI (v8) icon name shown next to the package title and used as the
   * Maloppsett item icon on import.
   */
  icon?: string

  /**
   * Package author/publisher.
   */
  author: string

  /**
   * Tags used for search and the derived category filter.
   */
  tags?: string[]

  /**
   * Absolute URL to the thumbnail image (GitHub raw URL).
   */
  thumbnail?: string

  /**
   * Absolute URL to the `.pppkg` (GitHub release asset).
   */
  downloadUrl: string

  /**
   * Minimum required Prosjektportalen version (semver).
   */
  minPPVersion?: string

  /**
   * Date this version was published (YYYY-MM-DD). Used for the "Nyeste" sort.
   */
  publishedDate?: string

  /**
   * Absolute URL to the package `CHANGELOG.md` (GitHub raw URL). Parsed by
   * the details panel into version history.
   */
  changelogUrl?: string
}
