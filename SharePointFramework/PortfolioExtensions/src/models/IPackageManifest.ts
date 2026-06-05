import { PackageType } from './ICatalogPackage'

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
 * `manifest.json` inside a `.pppkg`. Mirrors
 * `schema/pppkg-manifest.schema.json` in the hosting repo.
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
  }
  content?: {
    items: IManifestContentItem[]
  }
  changelog?: string
}
