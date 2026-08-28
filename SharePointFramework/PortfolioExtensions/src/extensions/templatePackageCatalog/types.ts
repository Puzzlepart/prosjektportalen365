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
   * Opt-out for the taxonomy provisioning step (Mode A import and Mode B
   * publish-as-cloud-template). The step is on by default; only an explicit
   * `false` disables it. See `services/featureFlags.ts`.
   */
  featureFlagProvisioning?: boolean

  /**
   * Ingestion endpoint for install-telemetry events (see
   * `services/TelemetryService.ts`). Defaults to the prosjektportalen-assist
   * endpoint when omitted; an empty string disables telemetry for the
   * installation.
   */
  telemetryUrl?: string
}
