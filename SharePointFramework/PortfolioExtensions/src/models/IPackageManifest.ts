/**
 * The package manifest interfaces now live in `pp365-shared-library` so both
 * PortfolioExtensions (catalog import) and ProjectExtensions (skymal resolution
 * in the setup wizard) share one definition. Re-exported here for backwards
 * compatibility with existing `from 'models'` imports.
 *
 * `PackageType` is intentionally NOT re-exported — it is defined locally in
 * {@link ICatalogPackage} to avoid a duplicate export from `models/index.ts`.
 */
export type {
  IPackageManifest,
  IManifestExtension,
  IManifestContentItem,
  IManifestListContent
} from 'pp365-shared-library'
