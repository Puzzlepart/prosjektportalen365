import { ISPDataAdapterBaseConfiguration } from 'pp365-shared-library/lib/data'

/** Configuration accepted by the project web parts' SharePoint adapter. */
export type ISPDataAdapterConfiguration = ISPDataAdapterBaseConfiguration

/** Archive-log fields identifying a requested operation and its scope. */
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

/** Count of archived items grouped by scope and status. */
export interface IArchiveScopeStatus {
  scope: string
  count: number
  status: string
}

/** Archive operation with its date, message and scope totals. */
export interface IArchiveOperation {
  operation: string
  date: Date
  message: string
  documentCount: number
  listCount: number
  totalItems: number
  scopes: IArchiveScopeStatus[]
}

/** Project archive summary with its grouped operations. */
export interface IArchiveStatusInfo {
  lastArchiveDate: Date
  operations: IArchiveOperation[]
}

/** Document metadata used to choose archive candidates. */
export interface IArchiveDocumentItem {
  id: number
  itemId: string
  title: string
  projectPhaseId: string
  documentTypeId: string
  url: string
  type: 'file'
}

/** List metadata used to choose archive candidates. */
export interface IArchiveListItem {
  id: string
  itemId: string
  title: string
  url: string
  type: 'list'
  itemCount: number
}
