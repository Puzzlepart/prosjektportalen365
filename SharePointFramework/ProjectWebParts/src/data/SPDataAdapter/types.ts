import { ISPDataAdapterBaseConfiguration } from 'pp365-shared-library/lib/data'

export type ISPDataAdapterConfiguration = ISPDataAdapterBaseConfiguration

/**
 * Interface for archive log entry data
 */
export interface IArchiveLogEntry {
  Title: string
  GtLogWebUrl: string
  GtLogMessage: string
  GtLogOperation: string
  GtLogReference?: string
  GtLogStatus: string
}

/**
 * Type for archive log status values
 */
export type ArchiveLogStatus = 'Success' | 'Error' | 'Warning' | 'In Progress'

/**
 * Type for archive log operation values
 */
export type ArchiveLogOperation = 'Document Archive' | 'List Archive'

/**
 * Interface for archive document item data
 */
export interface IArchiveDocumentItem {
  id: number
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
  title: string
  url: string
  type: 'list'
}
