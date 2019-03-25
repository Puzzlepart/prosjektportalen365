import { override } from '@microsoft/decorators';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { Logger, LogLevel } from '@pnp/logging';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { BaseTaskError } from '../BaseTaskError';
import SpEntityPortalService from 'sp-entityportal-service';

export default class SetupProjectInformation extends BaseTask {
    public static taskName = 'SetupProjectInformation';

    constructor() {
        super(SetupProjectInformation.taskName);
    }

    @override
    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            const { groupId } = params.context.pageContext.legacyPageContext;
            const spEntityPortalService = new SpEntityPortalService({
                webUrl: params.data.hub.url,
                listName: params.properties.projectsList,
                identityFieldName: 'GtGroupId',
                urlFieldName: 'GtSiteUrl',
            });
            let entity: any;
            try {
                entity = await spEntityPortalService.getEntityItem(params.context.pageContext.legacyPageContext.groupId);
            } catch (error) {
                Logger.log({ message: `(ProjectSetupApplicationCustomizer) SetupProjectInformation: Adding project to list '${params.properties.projectsList}' at ${params.data.hub.url}`, data: { groupId: groupId }, level: LogLevel.Info });
                entity = await spEntityPortalService.newEntity(params.context.pageContext.legacyPageContext.groupId, params.context.pageContext.site.absoluteUrl, { GtSiteId: params.context.pageContext.site.id.toString() }, params.data.hub.url);
            }
            return { ...params, entity };
        } catch (error) {
            throw new BaseTaskError(SetupProjectInformation.taskName, error);
        }
    }
}