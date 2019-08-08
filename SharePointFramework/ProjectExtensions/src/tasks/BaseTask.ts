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
     * Log information
     * 
     * @param {string} message Message
     * @param {any} data Data
     */
    public logInformation(message: string, data?: any) {
        Logger.log({ message: `(ProjectSetupApplicationCustomizer) ${this.name}: ${message}`, data, level: LogLevel.Info });
    }
}