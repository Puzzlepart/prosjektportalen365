/** Structured task log entry shown in the progress UI. */
export interface ILogEntry {
  message: string
  level: 'info' | 'warning' | 'error'
}

/** Reports task progress and optional structured log detail. */
export type OnProgressCallbackFunction = (
  text: string,
  subText: string,
  iconName: string,
  logEntry?: ILogEntry
) => void
