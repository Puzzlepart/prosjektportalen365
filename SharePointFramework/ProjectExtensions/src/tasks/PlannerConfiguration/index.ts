import { override } from '@microsoft/decorators';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { Logger, LogLevel } from '@pnp/logging';
import { IBaseTaskParams } from '../IBaseTaskParams';
export default class PlannerConfiguration extends BaseTask {
    public static taskName = 'SetupProjectInformation';

    constructor() {
        super(PlannerConfiguration.taskName);
    }

    @override
    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration', level: LogLevel.Info });
        return params;
    }
}
