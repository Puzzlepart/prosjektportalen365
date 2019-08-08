import { IBaseTaskParams } from './IBaseTaskParams';
import { virtual } from '@microsoft/decorators';

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
        onProgress('BaseTask', null);
        return params;
    }
}