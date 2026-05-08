import { ISPDataAdapterBaseConfiguration } from 'pp365-shared-library/lib/data'

export type ISPDataAdapterConfiguration = ISPDataAdapterBaseConfiguration

/**
 * Interface for archive log entry data
 */
export interface IArchiveLogEntry {
  Title: string
  GtLogStatus: string
  GtLogOperation: string
  GtLogMessage: string
  GtLogScope: string
  GtLogWebUrl: string
  GtLogReference?: string
  GtLogItemId?: string
}

/**
 * Most recent archive log entry for a single item, used to inform users about previous archiving.
 */
export interface IArchiveItemHistory {
  date: Date
  status: string
  operation: string
  titleAtTimeOfArchive?: string
}

/**
 * Interface for archive scope status
 */
export interface IArchiveScopeStatus {
  scope: string
  count: number
  status: string
}

/**
 * Interface for a single archive operation
 */
export interface IArchiveOperation {
  operation: string
  date: Date
  message: string
  documentCount: number
  listCount: number
  totalItems: number
  scopes: IArchiveScopeStatus[]
}

/**
 * Interface for detailed archive information
 */
export interface IArchiveStatusInfo {
  lastArchiveDate: Date
  operations: IArchiveOperation[]
}

/**
 * Interface for archive document item data
 */
export interface IArchiveDocumentItem {
  id: number
  itemId: string
  title: string
  projectPhaseId: string
  documentTypeId: string
  url: string
  type: 'file'
}

/**
 * Interface for archive list item data
 */
export interface IArchiveListItem {
  id: string
  itemId: string
  title: string
  url: string
  type: 'list'
  itemCount: number
}
