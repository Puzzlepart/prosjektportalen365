/** Selectable document or list with its archive eligibility and metadata. */
export interface IArchiveItem {
  id: string | number

  title: string

  /**
   * Type of the item (file, list, folder)
   */
  type: 'file' | 'list' | 'folder'

  url?: string

  selected: boolean

  /**
   * Whether the item is disabled (cannot be selected)
   */
  disabled?: boolean

  /**
   * Project phase ID (only for documents)
   */
  projectPhaseId?: string

  /**
   * Document type ID (only for documents)
   */
  documentTypeId?: string

  /**
   * Item count (only for lists)
   */
  itemCount?: number
}

/** Expandable group of archive candidates. */
export interface IArchiveSection {
  key: string

  title: string

  expanded: boolean

  items: IArchiveItem[]
}

/** Documents and lists selected for a phase-change archive operation. */
export interface IArchiveConfiguration {
  /**
   * Selected files from Documents library
   */
  documents: IArchiveItem[]

  lists: IArchiveItem[]
}
