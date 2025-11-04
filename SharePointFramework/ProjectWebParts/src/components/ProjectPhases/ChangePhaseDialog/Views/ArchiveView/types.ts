export interface IArchiveItem {
  /**
   * Unique identifier for the item
   */
  id: string | number

  /**
   * Display title of the item
   */
  title: string

  /**
   * Type of the item (file, list, folder)
   */
  type: 'file' | 'list' | 'folder'

  /**
   * URL to the item
   */
  url?: string

  /**
   * Whether the item is selected for archiving
   */
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

export interface IArchiveSection {
  /**
   * Section identifier
   */
  key: string

  /**
   * Section display title
   */
  title: string

  /**
   * Whether the section is expanded
   */
  expanded: boolean

  /**
   * Items in the section
   */
  items: IArchiveItem[]
}

export interface IArchiveConfiguration {
  /**
   * Selected files from Documents library
   */
  documents: IArchiveItem[]

  /**
   * Selected lists to archive
   */
  lists: IArchiveItem[]
}
