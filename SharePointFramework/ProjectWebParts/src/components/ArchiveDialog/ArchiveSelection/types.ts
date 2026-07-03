import type { IArchiveItemHistory } from '../../../data/SPDataAdapter/types'

/**
 * A single archivable item (document or list) shown in the selection tables.
 */
export interface IArchiveItem {
  /** Row/selection key, unique within its section. */
  id: string | number
  /** Stable SharePoint GUID (document `UniqueId` / list `Id`) used for logging and rename-stable history matching. */
  spItemId?: string
  title: string
  type: 'file' | 'list'
  url?: string
  selected: boolean
  disabled?: boolean
  projectPhaseId?: string
  /** Display label of the project phase term (documents). */
  phaseName?: string
  documentTypeId?: string
  documentTypeName?: string
  dateModified?: string
  /** Display name of the user who created the document. */
  author?: string
  dateCreated?: string
  /** Display name of the user who last modified the document. */
  modifiedBy?: string
  itemCount?: number
  previousArchive?: IArchiveItemHistory
}

/**
 * View filters for the documents section (search + document type). Filtering
 * only affects which rows are shown — items selected before filtering stay in
 * the archive configuration.
 */
export interface IArchiveDocumentFilters {
  searchTerm?: string
  documentTypeIds?: string[]
  archiveStatuses?: string[]
}

export interface IArchiveSection {
  key: string
  title: string
  items: IArchiveItem[]
  /** Number of selected items in the section. */
  selectedCount: number
  /** True when every selectable (non-disabled) item is selected. */
  allSelected: boolean
  /** True when some — but not all — selectable items are selected. */
  someSelected: boolean
}

/**
 * The set of items the user has chosen to archive, split by scope.
 */
export interface IArchiveConfiguration {
  documents: IArchiveItem[]
  lists: IArchiveItem[]
}

export interface IArchiveSelectionProps {
  documents: IArchiveItem[]
  lists: IArchiveItem[]
  history?: Map<string, IArchiveItemHistory>
  /**
   * When provided, documents are filtered to those matching this phase id (plus
   * documents without a phase). Used by the phase-change flow. Omit for manual mode.
   */
  currentPhaseId?: string
  /**
   * Whether the document library has the document type (`GtDocumentType`) field —
   * controls the "Dokumenttype" column. Falls back to deriving from the items.
   */
  hasDocumentTypes?: boolean
  /**
   * Seeds the selection on mount. Pass the current configuration so navigating
   * back from the confirm step restores the selection instead of wiping it
   * (the component unmounts between wizard views).
   */
  initialSelection?: IArchiveConfiguration
  isLoading?: boolean
  onConfigurationChange: (config: IArchiveConfiguration) => void
}
