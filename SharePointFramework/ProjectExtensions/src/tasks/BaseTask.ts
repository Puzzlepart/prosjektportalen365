import { IBaseTaskParams } from './IBaseTaskParams';
import { virtual } from '@microsoft/decorators';
import { Logger, LogLevel } from '@pnp/logging';

export type OnProgressCallbackFunction = (text: string, iconName: string) => void;

export class BaseTask {
    public params: IBaseTaskParams;
    public name: string;

    /**
     * Execute task
     * 
     * @param {IBaseTaskParams} params Params
     * @param {OnProgressCallbackFunction} onProgress Progress function
     */
    @virtual
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        return null;
    }

    /**
     * Log error
     * 
     * @param {string} message Message
     * @param {any} data Data
     */
    public logError(message: string, data?: any) {
        this.log(`(ProjectSetupApplicationCustomizer) ${this.name}: ${message}`, data, LogLevel.Error);
    }

    /**
     * Log warning
     * 
     * @param {string} message Message
     * @param {any} data Data
     */
    public logWarning(message: string, data?: any) {
        this.log(`(ProjectSetupApplicationCustomizer) ${this.name}: ${message}`, data, LogLevel.Warning);
    }

    /**
     * Log information
     * 
     * @param {string} message Message
     * @param {any} data Data
     */
    public logInformation(message: string, data?: any) {
        this.log(`(ProjectSetupApplicationCustomizer) ${this.name}: ${message}`, data, LogLevel.Info);
    }

    /**
     * Log 
     * 
     * @param {string} message Message
     * @param {any} data Data
     * @param {LogLevel} level Level
     */
    protected log(message: string, data: any, level: LogLevel) {
        Logger.log({ message, data, level });
    }
}