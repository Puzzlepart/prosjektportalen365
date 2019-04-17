import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import { override } from '@microsoft/decorators';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { Logger, LogLevel } from '@pnp/logging';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { BaseTaskError } from '../BaseTaskError';
import SpEntityPortalService from 'sp-entityportal-service';

export default class SetupProjectInformation extends BaseTask {
    constructor() {
        super('SetupProjectInformation');
    }

    @override
    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            const { groupId } = params.context.pageContext.legacyPageContext;
            const { absoluteUrl, id } = params.context.pageContext.site;
            const spEntityPortalService = new SpEntityPortalService({
                webUrl: params.data.hub.url,
                listName: params.properties.projectsList,
                identityFieldName: 'GtGroupId',
                urlFieldName: 'GtSiteUrl',
            });
            try {
                params.entity = await spEntityPortalService.getEntityItem(groupId);
            } catch (error) {
                Logger.log({ message: `(ProjectSetupApplicationCustomizer) SetupProjectInformation: Adding project to list '${params.properties.projectsList}' at ${params.data.hub.url}`, data: { groupId, siteId: id.toString() }, level: LogLevel.Info });
                params.entity = await spEntityPortalService.newEntity(groupId, absoluteUrl, { GtSiteId: id.toString() }, params.data.hub.url);
            }
            return params;
        } catch (error) {
            throw new BaseTaskError(this.name, strings.SetupProjectInformationErrorMessage, error);
        }
    }
}