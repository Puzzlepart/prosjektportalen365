/**
 * Package type as defined by the hosting manifest/catalog schema.
 */
export type PackageType = 'template' | 'extension' | 'content'

/**
 * Project extension (prosjekttillegg) entry in a package manifest.
 */
export interface IManifestExtension {
  id: string
  name: string
  description?: string
  /**
   * Relative path to the extension JSON file inside the `.pppkg`
   * (e.g. `provisioning/extensions/EnkeltProsjekt.json`).
   */
  file: string
  optional?: boolean
  defaultSelected?: boolean
}

/**
 * Standard content item entry in a package manifest.
 */
export interface IManifestContentItem {
  id: string
  name: string
  description?: string
  /**
   * Relative path to the content JSON file inside the `.pppkg`
   * (e.g. `content/phase-checklist.json`).
   */
  sourceFile: string
  /**
   * Target SharePoint list (internal/display name).
   */
  targetList: string
  optional?: boolean
  defaultSelected?: boolean
}

/**
 * List-content configuration (Listeinnhold) entry in a package manifest. Each
 * entry becomes an item in the hub **Listeinnhold** (List Content) list and is
 * linked to the imported Maloppsett item via `ListContentConfigLookup`, so the
 * setup wizard can copy rows from a hub `sourceList` into a project's
 * `destinationList` when the template is used.
 *
 * For a **skymal** (cloud template) nothing is provisioned to the hub — the
 * setup wizard reads the rows directly from the bundled `hub-template.json`
 * `Lists[]` entry whose `Title === sourceList` and applies them to the project's
 * `destinationList`.
 */
export interface IManifestListContent {
  /**
   * Title of the Listeinnhold item — also the upsert key (re-import updates the
   * item with the same title instead of duplicating it).
   */
  title: string
  description?: string
  /**
   * Hub list the rows are copied **from** (`GtLccSourceList`). Typically a list
   * provisioned by this package's hub template (e.g. `Enkel Fasesjekkliste`).
   */
  sourceList: string
  /**
   * Project list the rows are copied **into** (`GtLccDestinationList`). Defaults
   * to {@link sourceList} when omitted.
   */
  destinationList?: string
  /**
   * Comma-separated internal names of the columns to copy (`GtLccFields`), or
   * `-` for none. Example: `GtSortOrder,Title,GtProjectPhase`.
   */
  fields?: string
  /** Selected by default in the setup wizard (`GtLccDefault`). */
  default?: boolean
  /** Hidden from the setup wizard (`GtLccHidden`). */
  hidden?: boolean
  /** Locked (cannot be deselected) in the setup wizard (`GtLccLocked`). */
  locked?: boolean
}

/**
 * `manifest.json` inside a `.pppkg`. Mirrors
 * `schema/pppkg-manifest.schema.json` in the hosting repo.
 *
 * Lives in shared-library so both PortfolioExtensions (catalog import) and
 * ProjectExtensions (skymal resolution in the setup wizard) share one definition.
 */
export interface IPackageManifest {
  $schema?: string
  id: string
  name: string
  description?: string
  version: string
  author: string
  license?: string
  minPPVersion?: string
  thumbnail?: string
  /**
   * Relative paths (within the package) to screenshot images bundled in the
   * `.pppkg` and hosted in the catalog repo, e.g.
   * `['assets/screenshots/forside.png', 'assets/screenshots/meny.png']`. The
   * build resolves these to absolute raw URLs in `catalog.json`. Shown as a
   * navigable carousel (with a full-size lightbox) in the catalog details pane.
   */
  screenshots?: string[]
  /**
   * Fluent UI icon name used as the Maloppsett item's icon (`IconName`) when a
   * template is imported. Falls back to a default when omitted.
   */
  icon?: string
  tags?: string[]
  type: PackageType
  /**
   * Whether this package can run as a **skymal** (cloud template) — i.e. applied
   * to a project entirely from its `.pppkg` with nothing provisioned to the hub.
   *
   * Set to `false` for packages that require hub-side provisioning the cloud
   * path cannot reproduce (a content type defined on the hub and bound to the
   * `Prosjekter` list, hub site columns, taxonomy term sets, etc.). Absent =
   * treated as `true`. When `false`, the catalog warns before publishing as a
   * skymal and the setup wizard warns on selection — neither blocks ("at own
   * risk").
   */
  cloudCompatible?: boolean
  /**
   * The package requires **Bestillingsportalen** to be installed for full use
   * (shown as a dependency tag in the catalog). Absent = not required.
   */
  requiresBestillingsportalen?: boolean
  /**
   * The package requires **Microsoft Entra** resources (app registrations,
   * permissions, etc.) to be set up for full use (shown as a dependency tag in
   * the catalog). Absent = not required.
   */
  requiresEntra?: boolean
  /**
   * Locales the package is available in, as BCP-47 codes (e.g. `nb-NO`,
   * `en-US`). Shown as an availability tag in the catalog. Absent = treated as
   * Norwegian only.
   */
  languages?: string[]
  provisioning?: {
    /**
     * Relative path to the hub-level sp-js-provisioning schema
     * (e.g. `provisioning/hub-template.json`).
     */
    hubTemplate?: string
    /**
     * Relative path to the project-level sp-js-provisioning schema
     * (e.g. `provisioning/template.json`).
     */
    template?: string
    /**
     * Content type ID (defined by the hub template) to record as
     * `GtProjectContentType` on the imported Maloppsett item, so the setup
     * wizard provisions projects from this template with that content type.
     */
    projectContentTypeId?: string
    extensions?: IManifestExtension[]
    /**
     * List-content (Listeinnhold) configurations created on the hub and linked
     * to the imported Maloppsett item.
     */
    listContent?: IManifestListContent[]
  }
  content?: {
    items: IManifestContentItem[]
  }
  changelog?: string
}
