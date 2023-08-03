import { Logger, LogLevel } from '@pnp/logging'
import React from 'react'
import { IBaseWebPartComponentProps, IBaseWebPartComponentState } from './types'

export class BaseWebPartComponent<
  T1 extends IBaseWebPartComponentProps,
  T2 extends IBaseWebPartComponentState<any>
> extends React.Component<T1, T2> {
  /**
   * Constructor
   *
   * @param _name Component name
   * @param props Props
   * @param state Initial state
   */
  constructor(private _name: string, props: T1, state: T2) {
    super(props)
    this.state = state
  }

  /**
   * Logs a info message
   *
   * @param message Message to log
   * @param scope Scope (normally the function calling the function)
   * @param data Data
   */
  public logInfo(message: string, scope: string, data?: any) {
    Logger.log({ message: `(${this._name}) (${scope}) ${message}`, data, level: LogLevel.Info })
  }

  /**
   * Logs a warning message
   *
   * @param message Message to log
   * @param scope Scope (normally the function calling the function)
   * @param data Data
   */
  public logWarning(message: string, scope: string, data?: any) {
    Logger.log({ message: `(${this._name}) (${scope}) ${message}`, data, level: LogLevel.Warning })
  }

  /**
   * Logs a warning message
   *
   * @param message Message to log
   * @param scope Scope (normally the function calling the function)
   * @param data Data
   */
  public logError(message: string, scope: string, data?: any) {
    Logger.log({ message: `(${this._name}) (${scope}) ${message}`, data, level: LogLevel.Error })
  }
}

export * from './types'
