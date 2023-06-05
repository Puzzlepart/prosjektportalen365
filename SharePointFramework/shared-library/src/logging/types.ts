/* eslint-disable max-classes-per-file */
export type ListLoggerEntryLevel = 'Info' | 'Warning' | 'Error'

export class IListLoggerEntry {
  webUrl?: string
  scope?: string
  functionName?: string
  message: string
  level?: ListLoggerEntryLevel
  component?: string
}

export class IListLoggerMemberMap {
  webUrl?: string
  scope?: string
  functionName?: string
  message?: string
  level?: string
  component?: string
  context?: string
}

export const defaultListLoggerMemberMap: Record<string, string> = {
  webUrl: 'GtLogWebUrl',
  scope: 'GtLogScope',
  functionName: 'GtLogFunctionName',
  message: 'GtLogMessage',
  level: 'GtLogLevel',
  component: 'GtLogComponentName',
  context: 'GtLogContext'
}
