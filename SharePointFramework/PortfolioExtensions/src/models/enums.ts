/**
 * Value of the `PpPkgType` choice field on the Maloppsett list. The stored
 * values are hardcoded Norwegian literals (kept stable across locales so the
 * TypeScript comparisons below always work).
 */
export enum PpPkgType {
  /** Local template authored in the installation (default). */
  Lokal = 'Lokal',
  /** Imported from the catalog (Mode A) — provisioned locally. */
  Importert = 'Importert',
  /** Central "cloud template" (Mode B) — metadata only, resolved at runtime. */
  Sentral = 'Sentral'
}

/**
 * Badge derived from a catalog package's Maloppsett or Prosjekttillegg match.
 */
export enum PackageBadge {
  /** No installed package match. */
  None = 'none',
  /** Imported package without a known newer catalog version, including unmanaged extensions. */
  Installed = 'installed',
  /** Matching `Sentral` item. */
  Central = 'central',
  /** Matching item whose version is older than the catalog version. */
  UpdateAvailable = 'updateAvailable'
}

/**
 * Available import-step identifiers; `PackageInstaller` selects and orders the steps.
 */
export enum InstallStepKey {
  Download = 'download',
  Unzip = 'unzip',
  ValidateManifest = 'validateManifest',
  CheckVersion = 'checkVersion',
  CheckCompatibility = 'checkCompatibility',
  ProvisionHub = 'provisionHub',
  Taxonomy = 'taxonomy',
  StoreProjectTemplate = 'storeProjectTemplate',
  Extensions = 'extensions',
  Content = 'content',
  ListContent = 'listContent',
  UpdateTemplateOptions = 'updateTemplateOptions'
}

/**
 * Status of an install step. `warning` is a step that completed although part of
 * it failed: sp-js-provisioning logs what it could not apply as an error and goes on.
 */
export type InstallStepStatus = 'pending' | 'running' | 'done' | 'warning' | 'skipped' | 'error'

/**
 * A single granular line in the advanced install log. `group` is the type it
 * belongs to (a provisioning handler such as `Lists`, `SiteFields`,
 * `ContentTypes`, `Taxonomy`, `Files`, or a localized install-phase label),
 * which the advanced log uses to group and collapse entries like ProjectSetup.
 */
export interface IInstallLogEntry {
  group: string
  message: string
  level: 'info' | 'warning' | 'error'
}

/**
 * State of a single install step.
 */
export interface IInstallStep {
  key: InstallStepKey
  status: InstallStepStatus
  /**
   * Optional extra detail (e.g. "Hoppet over (feature flag av)" for a skipped
   * taxonomy step, or an error message).
   */
  detail?: string
}

/**
 * Overall state of a Mode A install, surfaced to {@link InstallProgress}.
 */
export interface IInstallProgress {
  steps: IInstallStep[]
  currentStep?: InstallStepKey
  /**
   * `warning` when the install completed, but sp-js-provisioning logged errors while
   * provisioning the hub (see {@link IInstallProgress.provisionErrors}).
   */
  status: 'running' | 'success' | 'warning' | 'error'
  /**
   * Flat, ordered advanced-log lines (grouped by {@link IInstallLogEntry.group}
   * in the UI). Captures every provisioning line plus curated step notes.
   */
  log: IInstallLogEntry[]
  /**
   * Terminal error message (when `status === 'error'`).
   */
  error?: string
  /**
   * The number of error lines sp-js-provisioning logged while provisioning the hub
   * (when `status === 'warning'`). The lines themselves are in {@link IInstallProgress.log}.
   */
  provisionErrors?: number
}
