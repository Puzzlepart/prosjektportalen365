import { IBaseDialogProps } from '../@BaseDialog/types'
import { IProgressProps } from 'pp365-shared-library'

/** Lifecycle state shown for a setup task. */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'error' | 'warning'
/** Severity of a setup log entry. */
export type LogLevel = 'info' | 'warning' | 'error'

/** Timestamped diagnostic message from a setup task. */
export interface ILogEntry {
  timestamp: Date
  message: string
  level: LogLevel
}

/** Status and diagnostic entries collected for a setup task. */
export interface ITaskProgress {
  name: string
  status: TaskStatus
  entries: ILogEntry[]
}

/** Setup progress, diagnostics and completion notices shown in the dialog. */
export interface IProgressDialogProps extends IBaseDialogProps {
  iconName?: string

  progressIndicator: IProgressProps

  taskProgress?: ITaskProgress[]

  /** Zero-based step index. */
  currentStep?: number

  totalSteps?: number

  /** Completion keeps a user-expanded log or a warning open for acknowledgement. */
  isComplete?: boolean

  /** Forces the advanced log open and displays the error below it. */
  error?: Error

  /** Keeps the completed dialog open until the user acknowledges the limitation. */
  warning?: { title: string; text: string }
}
