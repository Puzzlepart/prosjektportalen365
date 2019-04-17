import { IBaseTaskParams } from './IBaseTaskParams';

export type OnProgressCallbackFunction = (text: string, iconName: string) => void;

export class BaseTask {
    public params: IBaseTaskParams;

    /**
     * Constructor
     * 
     * @param {string} name Name
     */
    constructor(public name: string) { }

    /**
     * Execute task
     * 
     * @param {IBaseTaskParams} params Params
     * @param {OnProgressCallbackFunction} onProgress Progress function
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        onProgress('BaseTask', null);
        return params;
    }
}