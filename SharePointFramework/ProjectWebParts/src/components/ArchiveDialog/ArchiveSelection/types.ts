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
  documentTypeId?: string
  documentTypeName?: string
  dateModified?: string
  itemCount?: number
  previousArchive?: IArchiveItemHistory
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
  isLoading?: boolean
  onConfigurationChange: (config: IArchiveConfiguration) => void
}
