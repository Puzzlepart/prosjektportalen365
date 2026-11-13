/**
 * Command-set properties for the Template Package Catalog, supplied via the
 * `ClientSideComponentProperties` JSON on the registering CustomAction.
 */
export interface ITemplatePackageCatalogCommandProperties {
  /**
   * URL to the catalog.json. Defaults to the hosting repo's catalog when
   * empty (or the committed sample fixture in DEBUG). With a catalog of the
   * customer's own, no catalog events are sent (see `services/TelemetryService.ts`).
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
   * Ingestion endpoint for the catalog's events (see
   * `services/TelemetryService.ts`). Defaults to the prosjektportalen-assist
   * endpoint when omitted; an empty string stops the catalog's events for the
   * installation. The events also need the hub's usage statistics at Standard
   * or Utvidet (`UsageStatisticsLevel` 2 or 3) and `CatalogTelemetryEnabled` 1.
   */
  telemetryUrl?: string
}
