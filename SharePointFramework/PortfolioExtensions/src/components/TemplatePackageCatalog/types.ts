import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import {
  ICatalog,
  ICatalogPackage,
  ICompatibilityReport,
  ICrossReference,
  IInstallProgress
} from 'models'

/**
 * Props for the drawer root, supplied by the command set on mount.
 */
export interface ITemplatePackageCatalogProps {
  context: ListViewCommandSetContext
  catalogUrl?: string
  userGuideUrl?: string
  featureFlagProvisioning?: boolean
  onDismiss: () => void
}

export type SortKey = 'newest' | 'name'

/**
 * Master-pane layout: `grid` shows compact cards (multiple per row, like the
 * project list), `list` shows one card per row.
 */
export type RenderMode = 'grid' | 'list'

export const ALL_FILTER = 'all'

/**
 * Status filter values. `update` = "Oppdatering tilgjengelig".
 */
export type StatusFilter = 'all' | 'Lokal' | 'Importert' | 'Sentral' | 'update'

export interface ICatalogFilters {
  search: string
  type: string
  category: string
  status: StatusFilter
}

export interface ICatalogNotification {
  intent: 'success' | 'error'
  text: string
}

export interface ITemplatePackageCatalogState {
  loading: boolean
  degraded: boolean
  error?: string
  catalog?: ICatalog
  crossRef: Map<string, ICrossReference>
  /**
   * Installed Prosjektportalen version (from the installation log), used to
   * flag packages whose `minPPVersion` is newer than what's installed.
   * `undefined` when it can't be determined (treated as compatible).
   */
  installedVersion?: string
  filters: ICatalogFilters
  sort: SortKey
  renderMode: RenderMode
  page: number
  selectedPackageId?: string
  installProgress?: IInstallProgress
  /**
   * Conflicts found by the pre-import compatibility check, awaiting the admin's
   * "Avbryt" / "Fortsett likevel" decision (see {@link CompatibilityDialog}).
   */
  compatibilityReport?: ICompatibilityReport
  notification?: ICatalogNotification
  /**
   * A long-running detail-pane action in progress (publish-as-skymal downloads
   * and provisions to the hub; remove deletes the Maloppsett item). Drives the
   * spinner + disabled state on the action buttons so the user gets feedback and
   * can't double-submit. (Import uses {@link installProgress} instead.)
   */
  busyAction?: 'publish' | 'remove'
  /**
   * Whether the detail pane is shown in the <720px collapsed layout.
   */
  detailOpen: boolean
}

/**
 * Number of cards per page (client-side pagination).
 */
export const PAGE_SIZE = 8

export interface ITemplatePackageCatalogContext {
  props: ITemplatePackageCatalogProps
  state: ITemplatePackageCatalogState
  setState: (
    newState:
      | Partial<ITemplatePackageCatalogState>
      | ((current: ITemplatePackageCatalogState) => Partial<ITemplatePackageCatalogState>)
  ) => void
  /** All packages after search/filter/sort (not paginated). */
  filteredPackages: ICatalogPackage[]
  /** Current page slice of {@link filteredPackages}. */
  pagedPackages: ICatalogPackage[]
  pageCount: number
  /** Distinct categories derived from package tags. */
  categories: string[]
  selectedPackage?: ICatalogPackage
  crossRefFor: (packageId: string) => ICrossReference | undefined
  /**
   * Whether the installed Prosjektportalen version satisfies the package's
   * `minPPVersion`. Returns `true` when unknown (allow-with-warning).
   */
  isSupported: (pkg: ICatalogPackage) => boolean
  setFilter: (key: keyof ICatalogFilters, value: string) => void
  clearFilters: () => void
  setSort: (sort: SortKey) => void
  setRenderMode: (renderMode: RenderMode) => void
  setSelected: (packageId: string) => void
  setPage: (page: number) => void
  closeDetail: () => void
  importPackage: (pkg: ICatalogPackage) => Promise<void>
  publishCentral: (pkg: ICatalogPackage) => Promise<void>
  removePackage: (pkg: ICatalogPackage) => Promise<void>
  /**
   * Resolve the pending compatibility-conflict prompt: `true` continues the
   * import (skipping/overwriting per resolution), `false` cancels it.
   */
  resolveCompatibility: (proceed: boolean) => void
}
