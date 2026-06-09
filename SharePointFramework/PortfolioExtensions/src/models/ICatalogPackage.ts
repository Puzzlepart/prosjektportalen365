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
   * Absolute URLs (GitHub raw) to screenshot images, shown as a navigable
   * carousel with a full-size lightbox in the details pane. Resolved by the
   * hosting build from the manifest's relative `screenshots` paths.
   */
  screenshots?: string[]

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

  /**
   * Whether the package can run as a **skymal** (cloud template). `false` means
   * it needs hub-side provisioning the cloud path can't reproduce — publishing
   * it as a skymal warns "at own risk". Absent = treated as `true`.
   */
  cloudCompatible?: boolean

  /**
   * The package requires Bestillingsportalen for full use — shown as a
   * dependency tag in the catalog. Absent = not required.
   */
  requiresBestillingsportalen?: boolean

  /**
   * The package requires Microsoft Entra resources for full use — shown as a
   * dependency tag in the catalog. Absent = not required.
   */
  requiresEntra?: boolean

  /**
   * Locales the package is available in, as BCP-47 codes (e.g. `nb-NO`,
   * `en-US`). Shown as an availability tag in the details pane. Absent =
   * Norwegian only.
   */
  languages?: string[]
}
