export interface ILogEntry {
  message: string
  level: 'info' | 'warning' | 'error'
}

export type OnProgressCallbackFunction = (
  text: string,
  subText: string,
  iconName: string,
  logEntry?: ILogEntry
) => void
