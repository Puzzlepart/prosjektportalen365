import { Logger, LogLevel } from '@pnp/logging';
import { IProjectSetupApplicationCustomizerData } from 'extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import { IBaseTaskParams } from './IBaseTaskParams';
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction';

export interface IBaseTask {
    params: IBaseTaskParams;
    taskName: string;
    execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams>;
}

// tslint:disable-next-line: naming-convention
export abstract class BaseTask implements IBaseTask {
    public params: IBaseTaskParams;
    public taskName: string;

    constructor(public data: IProjectSetupApplicationCustomizerData) { }

    /**
     * Execute task
     * 
     * @param {IBaseTaskParams} params Task parameters
     * @param {OnProgressCallbackFunction} onProgress Progress function
     */
    public abstract execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams>;

    /**
     * Log error
     * 
     * @param {string} message Message
     * @param {any} data Data
     */
    public logError(message: string, data?: any) {
        this._log(`(ProjectSetupApplicationCustomizer) ${this.taskName}: ${message}`, data, LogLevel.Error);
    }

    /**
     * Log warning
     * 
     * @param {string} message Message
     * @param {any} data Data
     */
    public logWarning(message: string, data?: any) {
        this._log(`(ProjectSetupApplicationCustomizer) ${this.taskName}: ${message}`, data, LogLevel.Warning);
    }

    /**
     * Log information
     * 
     * @param {string} message Message
     * @param {any} data Data
     */
    public logInformation(message: string, data?: any) {
        this._log(`(ProjectSetupApplicationCustomizer) ${this.taskName}: ${message}`, data, LogLevel.Info);
    }

    /**
     * Log 
     * 
     * @param {string} message Message
     * @param {any} data Data
     * @param {LogLevel} level Level
     */
    protected _log(message: string, data: any, level: LogLevel) {
        Logger.log({ message, data, level });
    }
}

export * from './BaseTaskError';
export * from './IBaseTaskParams';