/**
 * Defines the severities stored in the SharePoint log list.
 */
export type ListLoggerEntryLevel = 'Info' | 'Warning' | 'Error'

/**
 * Describes a log entry before mapping it to SharePoint fields.
 */
export class IListLoggerEntry {
  webUrl?: string
  scope?: string
  functionName?: string
  message: string
  level?: ListLoggerEntryLevel
  component?: string
}

/**
 * Maps log-entry members to destination SharePoint field names.
 */
export class IListLoggerMemberMap {
  webUrl?: string
  scope?: string
  functionName?: string
  message?: string
  level?: string
  component?: string
  context?: string
}

/**
 * Maps standard log-entry members to the provisioned log-list fields.
 */
export const defaultListLoggerMemberMap: Record<string, string> = {
  webUrl: 'GtLogWebUrl',
  scope: 'GtLogScope',
  functionName: 'GtLogFunctionName',
  message: 'GtLogMessage',
  level: 'GtLogLevel',
  component: 'GtLogComponentName',
  context: 'GtLogContext'
}
