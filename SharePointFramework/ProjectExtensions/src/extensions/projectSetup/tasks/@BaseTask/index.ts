import { Logger, LogLevel } from '@pnp/logging'
import { IProjectSetupData } from 'extensions/projectSetup'
import { OnProgressCallbackFunction } from '../types'
import { IBaseTask, IBaseTaskParams } from './types'

/** Common setup-task parameters, progress reporting and task-prefixed logging. */
export abstract class BaseTask implements IBaseTask {
  public params: IBaseTaskParams
  public onProgress: OnProgressCallbackFunction

  constructor(
    public taskName: string,
    public data: IProjectSetupData
  ) {}

  /** Stores execution context for task helpers and progress reporting. */
  public initExecute(params: IBaseTaskParams, onProgress?: OnProgressCallbackFunction) {
    this.params = params
    this.onProgress = onProgress
  }

  /** Runs the task and returns parameters for the next task. */
  public abstract execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams>

  /** Logs an error with the setup task's name. */
  public logError(message: string, data?: any) {
    this._log(`(ProjectSetup) [${this.taskName}]: ${message}`, data, LogLevel.Error)
  }

  /** Logs a warning with the setup task's name. */
  public logWarning(message: string, data?: any) {
    this._log(`(ProjectSetup) [${this.taskName}]: ${message}`, data, LogLevel.Warning)
  }

  /** Logs an informational message with the setup task's name. */
  public logInformation(message: string, data?: any) {
    this._log(`(ProjectSetup) [${this.taskName}]: ${message}`, data, LogLevel.Info)
  }

  protected _log(message: string, data: any, level: LogLevel) {
    Logger.log({ message, data, level })
  }
}

export * from './engineLog'
export * from './types'
