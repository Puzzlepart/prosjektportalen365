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
   * Fluent UI icon name used as the Maloppsett item's icon (`IconName`) when a
   * template is imported. Falls back to a default when omitted.
   */
  icon?: string
  tags?: string[]
  type: PackageType
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
