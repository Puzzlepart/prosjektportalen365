/**
 * A single line in the "Innhold i malen" (package content) summary shown in
 * the details panel. Derived from the downloaded manifest's `content.items`
 * and `provisioning.extensions` — the catalog itself carries no content
 * summary, so this is only available once a package has been downloaded.
 */
export interface IPackageContentItem {
  /**
   * Stable key (manifest content/extension id).
   */
  key: string

  /**
   * Display label (manifest content/extension name).
   */
  label: string

  /**
   * Optional description from the manifest.
   */
  description?: string

  /**
   * Which part of the manifest this item came from.
   */
  kind: 'content' | 'extension'
}
