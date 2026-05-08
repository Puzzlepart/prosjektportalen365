import type { IArchiveItemHistory } from '../../../data/SPDataAdapter/types'

export interface IArchiveItem {
  id: string | number
  itemId?: string
  title: string
  type: 'file' | 'list' | 'folder'
  url?: string
  selected: boolean
  disabled?: boolean
  projectPhaseId?: string
  documentTypeId?: string
  itemCount?: number
  previousArchive?: IArchiveItemHistory
}

export interface IArchiveSection {
  key: string
  title: string
  expanded: boolean
  items: IArchiveItem[]
}

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
