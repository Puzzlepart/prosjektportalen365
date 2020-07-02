import { Logger, LogLevel } from '@pnp/logging'
import * as React from 'react'
import { IBaseWebPartComponentProps } from './IBaseWebPartComponentProps'
import { IBaseWebPartComponentState } from './IBaseWebPartComponentState'

export class BaseWebPartComponent<T1 extends IBaseWebPartComponentProps, T2 extends IBaseWebPartComponentState<any>> extends React.Component<T1, T2> {
    /**
     * Constructor
     * 
     * @param {string} _name Component name
     * @param {T1} props Props
     * @param {T2} state Initial state
     */
    constructor(private _name: string, props: T1, state: T2) {
        super(props)
        this.state = state
    }

    /**
     * Logs a info message
     * 
     * @param {string} message Message to log
     * @param {string} scope Scope (normally the function calling the function)
     * @param {string} data Data
     */
    public logInfo(message: string, scope: string, data?: any) {
        Logger.log({ message: `(${this._name}) (${scope}) ${message}`, data, level: LogLevel.Info })
    }

    /**
     * Logs a warning message
     * 
     * @param {string} message Message to log
     * @param {string} scope Scope (normally the function calling the function)
     * @param {string} data Data
     */
    public logWarning(message: string, scope: string, data?: any) {
        Logger.log({ message: `(${this._name}) (${scope}) ${message}`, data, level: LogLevel.Warning })
    }

    /**
     * Logs a warning message
     * 
     * @param {string} message Message to log
     * @param {string} scope Scope (normally the function calling the function)
     * @param {string} data Data
     */
    public logError(message: string, scope: string, data?: any) {
        Logger.log({ message: `(${this._name}) (${scope}) ${message}`, data, level: LogLevel.Error })
    }
}

export * from './IBaseWebPartComponentProps'
export * from './IBaseWebPartComponentState'
