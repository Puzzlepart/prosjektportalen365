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
}

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
