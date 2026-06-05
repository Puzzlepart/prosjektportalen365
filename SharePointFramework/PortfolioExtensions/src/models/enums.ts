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
  /** Central "skymal" (Mode B) — metadata only, resolved at runtime. */
  Sentral = 'Sentral'
}

/**
 * Badge derived for a catalog package by cross-referencing it against the
 * Maloppsett items.
 */
export enum PackageBadge {
  /** No matching Maloppsett item. */
  None = 'none',
  /** Matching `Importert` item, same version. */
  Installed = 'installed',
  /** Matching `Sentral` item. */
  Central = 'central',
  /** Matching item whose version is older than the catalog version. */
  UpdateAvailable = 'updateAvailable'
}

/**
 * Ordered steps of the Mode A import pipeline. The UI maps each key to a
 * localized label (see {@link InstallProgress}).
 */
export enum InstallStepKey {
  Download = 'download',
  Unzip = 'unzip',
  ValidateManifest = 'validateManifest',
  CheckVersion = 'checkVersion',
  ProvisionHub = 'provisionHub',
  Taxonomy = 'taxonomy',
  StoreProjectTemplate = 'storeProjectTemplate',
  Extensions = 'extensions',
  Content = 'content',
  UpdateTemplateOptions = 'updateTemplateOptions'
}

export type InstallStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error'

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
  status: 'running' | 'success' | 'error'
  /**
   * Terminal error message (when `status === 'error'`).
   */
  error?: string
}
