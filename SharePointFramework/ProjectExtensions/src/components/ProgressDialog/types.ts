import { IProgressIndicatorProps } from '@fluentui/react'
import { IBaseDialogProps } from '../@BaseDialog/types'

export type TaskStatus = 'pending' | 'running' | 'completed' | 'error' | 'warning'
export type LogLevel = 'info' | 'warning' | 'error'

export interface ILogEntry {
  timestamp: Date
  message: string
  level: LogLevel
}

export interface ITaskProgress {
  name: string
  status: TaskStatus
  entries: ILogEntry[]
}

export interface IProgressDialogProps extends IBaseDialogProps {
  /**
   * Icon name
   */
  iconName?: string

  /**
   * Progress indicator props
   */
  progressIndicator: IProgressIndicatorProps

  /**
   * Detailed task progress for the advanced log
   */
  taskProgress?: ITaskProgress[]

  /**
   * Current step index (0-based)
   */
  currentStep?: number

  /**
   * Total number of steps
   */
  totalSteps?: number
}
