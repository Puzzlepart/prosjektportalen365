import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { ICatalog, ICatalogPackage, ICrossReference, IInstallProgress } from 'models'

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
  filters: ICatalogFilters
  sort: SortKey
  page: number
  selectedPackageId?: string
  installProgress?: IInstallProgress
  notification?: ICatalogNotification
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
  setFilter: (key: keyof ICatalogFilters, value: string) => void
  clearFilters: () => void
  setSort: (sort: SortKey) => void
  setSelected: (packageId: string) => void
  setPage: (page: number) => void
  closeDetail: () => void
  importPackage: (pkg: ICatalogPackage) => Promise<void>
  publishCentral: (pkg: ICatalogPackage) => Promise<void>
  removePackage: (pkg: ICatalogPackage) => Promise<void>
}
