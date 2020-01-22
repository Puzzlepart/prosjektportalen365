import { Logger, LogLevel } from '@pnp/logging';
import { IProjectSetupData } from 'extensions/projectSetup';
import { IProjectSetupSettings } from 'extensions/projectSetup/ProjectSetupSettings';
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction';
import { IBaseTask } from './IBaseTask';
import { IBaseTaskParams } from './IBaseTaskParams';

// tslint:disable-next-line: naming-convention
export abstract class BaseTask implements IBaseTask {
    public settings: IProjectSetupSettings<boolean>;
    public params: IBaseTaskParams;
    public taskName: string;
    public onProgress: OnProgressCallbackFunction;

    constructor(public data: IProjectSetupData) {
        this.settings = data.settings.values;
    }

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
        this._log(`(ProjectSetup) [${this.taskName}]: ${message}`, data, LogLevel.Error);
    }

    /**
     * Log warning
     * 
     * @param {string} message Message
     * @param {any} data Data
     */
    public logWarning(message: string, data?: any) {
        this._log(`(ProjectSetup) [${this.taskName}]: ${message}`, data, LogLevel.Warning);
    }

    /**
     * Log information
     * 
     * @param {string} message Message
     * @param {any} data Data
     */
    public logInformation(message: string, data?: any) {
        this._log(`(ProjectSetup) [${this.taskName}]: ${message}`, data, LogLevel.Info);
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
export * from './IBaseTask';
export * from './IBaseTaskParams';
