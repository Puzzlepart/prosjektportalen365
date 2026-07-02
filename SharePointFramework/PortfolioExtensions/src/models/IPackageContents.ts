/**
 * Icon category for a package content entry / hierarchy node.
 */
export type ContentIconName =
  | 'lists'
  | 'contentTypes'
  | 'siteFields'
  | 'taxonomy'
  | 'termSet'
  | 'term'
  | 'extensions'
  | 'files'
  | 'content'

/**
 * A single line in the package content summary (icon + label + count),
 * shown in the details panel before installing a package.
 */
export interface IPackageContentSummaryEntry {
  key: string
  label: string
  count?: number
  icon: ContentIconName
}

/**
 * A node in the package content hierarchy ("Se detaljer"), built from the
 * package's provisioning/content JSON files so the user can see which lists,
 * content types, site fields, term sets, etc. the template provisions.
 */
export interface IHierarchyNode {
  key: string
  label: string
  count?: number
  icon?: ContentIconName
  children?: IHierarchyNode[]
  /**
   * Raw URL of the underlying JSON/text file (extension or content file), when
   * the node maps to a single file. Enables an inline code preview in the UI.
   */
  fileUrl?: string
}

/**
 * Parsed contents of a package: a high-level summary and a drill-down
 * hierarchy. Produced by `CatalogService.getPackageContents` from the
 * package's manifest + provisioning + content JSON (no install required).
 */
export interface IPackageContents {
  summary: IPackageContentSummaryEntry[]
  hierarchy: IHierarchyNode[]
}
