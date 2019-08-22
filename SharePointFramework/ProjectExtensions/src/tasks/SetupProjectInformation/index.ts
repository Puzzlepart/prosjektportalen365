import { override } from '@microsoft/decorators';
import { task } from 'decorators/task';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import SpEntityPortalService from 'sp-entityportal-service';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';


@task('SetupProjectInformation')
export default class SetupProjectInformation extends BaseTask {
    @override
    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            const spEntityPortalService = new SpEntityPortalService({
                webUrl: params.data.hub.url,
                listName: params.properties.projectsList,
                identityFieldName: 'GtGroupId',
                urlFieldName: 'GtSiteUrl',
            });
            this.logInformation(`Attempting to retrieve project item from list '${params.properties.projectsList}' at ${params.data.hub.url}`, { groupId: params.context.pageContext.legacyPageContext.groupId, siteId: params.context.pageContext.site.id.toString() });
            params.entity = await spEntityPortalService.getEntityItem(params.context.pageContext.legacyPageContext.groupId);
            if (!params.entity) {
                this.logInformation(`Adding project to list '${params.properties.projectsList}' at ${params.data.hub.url}`, { groupId: params.context.pageContext.legacyPageContext.groupId, siteId: params.context.pageContext.site.id.toString() });
                params.entity = await spEntityPortalService.newEntity(
                    params.context.pageContext.legacyPageContext.groupId,
                    params.context.pageContext.web.absoluteUrl,
                    { Title: params.context.pageContext.web.title, GtSiteId: params.context.pageContext.site.id.toString() },
                    params.data.hub.url,
                );
                this.logInformation(`Project added to list '${params.properties.projectsList}' at ${params.data.hub.url}`, { id: params.entity.item.Id });
            }
            return params;
        } catch (error) {
            throw new BaseTaskError(this.name, strings.SetupProjectInformationErrorMessage, error);
        }
    }
}