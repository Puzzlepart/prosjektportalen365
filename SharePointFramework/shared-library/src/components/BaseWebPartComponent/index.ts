import { Logger, LogLevel } from '@pnp/logging'
import React from 'react'
import { IBaseWebPartComponentProps, IBaseWebPartComponentState } from './types'

/**
 * Legacy class-component base providing scoped PnP logging.
 */
export class BaseWebPartComponent<
  T1 extends IBaseWebPartComponentProps,
  T2 extends IBaseWebPartComponentState<any>
> extends React.Component<T1, T2> {
  constructor(
    private _name: string,
    props: T1,
    state: T2
  ) {
    super(props)
    this.state = state
  }

  /**
   * Logs an informational message with the component name and calling scope.
   */
  public logInfo(message: string, scope: string, data?: any) {
    Logger.log({ message: `(${this._name}) (${scope}) ${message}`, data, level: LogLevel.Info })
  }

  /**
   * Logs a warning with the component name and calling scope.
   */
  public logWarning(message: string, scope: string, data?: any) {
    Logger.log({ message: `(${this._name}) (${scope}) ${message}`, data, level: LogLevel.Warning })
  }

  /**
   * Logs an error with the component name and calling scope.
   */
  public logError(message: string, scope: string, data?: any) {
    Logger.log({ message: `(${this._name}) (${scope}) ${message}`, data, level: LogLevel.Error })
  }
}

export * from './types'
