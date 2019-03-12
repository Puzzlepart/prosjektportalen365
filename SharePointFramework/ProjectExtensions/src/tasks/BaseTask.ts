import { IBaseTaskParams } from './IBaseTaskParams';

export type OnProgressCallbackFunction = (status: string, iconName: string) => void;

export class BaseTask {
    public params: IBaseTaskParams;
    constructor(public name?: string) {
        this.name = name;
        this.params = null;
    }
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        onProgress('BaseTask', null);
        return params;
    }
}