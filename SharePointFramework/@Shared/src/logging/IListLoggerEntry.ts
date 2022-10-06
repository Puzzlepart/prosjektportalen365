import { ListLoggerEntryLevel } from './ListLoggerEntryLevel'

export class IListLoggerEntry {
  webUrl?: string
  scope?: string
  functionName?: string
  message: string
  level?: ListLoggerEntryLevel
  component?: string
}
