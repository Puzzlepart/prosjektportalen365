import { ICatalogPackage } from './ICatalogPackage'

/**
 * The central package catalog (`catalog.json`) hosted in the
 * `prosjektportalen-hosting` repository. Indexes all available template
 * packages. Mirrors `schema/catalog.schema.json` in the hosting repo.
 */
export interface ICatalog {
  $schema?: string

  /**
   * Timestamp of the last catalog update (ISO 8601). Used as the
   * cache-invalidation key in {@link CatalogService}.
   */
  lastUpdated: string

  /**
   * All available packages.
   */
  packages: ICatalogPackage[]
}
