import { Logger, LogLevel } from '@pnp/logging'
import { IProjectSetupData } from 'extensions/projectSetup'
import { OnProgressCallbackFunction } from '../types'
import { IBaseTask, IBaseTaskParams } from './types'

export abstract class BaseTask implements IBaseTask {
  public params: IBaseTaskParams
  public onProgress: OnProgressCallbackFunction

  constructor(public taskName: string, public data: IProjectSetupData) {}

  /**
   * Initialize execute setting parameters and on progress callback function
   * on the task instance.
   *
   * @param params Parameters
   * @param onProgress On progress callback function
   */
  public initExecute(params: IBaseTaskParams, onProgress?: OnProgressCallbackFunction) {
    this.params = params
    this.onProgress = onProgress
  }

  /**
   * Execute task
   *
   * @param params Task parameters
   * @param onProgress On progress callback function
   */
  public abstract execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams>

  /**
   * Log error
   *
   * @param message Message
   * @param data Data
   */
  public logError(message: string, data?: any) {
    this._log(`(ProjectSetup) [${this.taskName}]: ${message}`, data, LogLevel.Error)
  }

  /**
   * Log warning
   *
   * @param message Message
   * @param data Data
   */
  public logWarning(message: string, data?: any) {
    this._log(`(ProjectSetup) [${this.taskName}]: ${message}`, data, LogLevel.Warning)
  }

  /**
   * Log information
   *
   * @param message Message
   * @param data Data
   */
  public logInformation(message: string, data?: any) {
    this._log(`(ProjectSetup) [${this.taskName}]: ${message}`, data, LogLevel.Info)
  }

  /**
   * Log
   *
   * @param message Message
   * @param data Data
   * @param level Level
   */
  protected _log(message: string, data: any, level: LogLevel) {
    Logger.log({ message, data, level })
  }
}

export * from './types'
