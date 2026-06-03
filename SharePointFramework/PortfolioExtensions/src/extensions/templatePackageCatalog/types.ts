/**
 * Command-set properties for the Template Package Catalog, supplied via the
 * `ClientSideComponentProperties` JSON on the registering CustomAction.
 */
export interface ITemplatePackageCatalogCommandProperties {
  /**
   * URL to the catalog.json. Defaults to the hosting repo's catalog when
   * empty (or the committed sample fixture in DEBUG).
   */
  catalogUrl?: string

  /**
   * URL the "Se brukerveiledning" footer link points to.
   */
  userGuideUrl?: string

  /**
   * Enables the feature-flagged taxonomy provisioning step during Mode A
   * import. See `services/featureFlags.ts`.
   */
  featureFlagProvisioning?: boolean
}
