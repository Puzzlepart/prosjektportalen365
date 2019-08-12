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
            const { pageContext } = params.context;
            const spEntityPortalService = new SpEntityPortalService({
                webUrl: params.data.hub.url,
                listName: params.properties.projectsList,
                identityFieldName: 'GtGroupId',
                urlFieldName: 'GtSiteUrl',
            });
            try {
                params.entity = await spEntityPortalService.getEntityItem(pageContext.legacyPageContext.groupId);
            } catch (error) {
                this.logInformation(`Adding project to list '${params.properties.projectsList}' at ${params.data.hub.url}`, { groupId: pageContext.legacyPageContext.groupId, siteId: pageContext.site.id.toString() });
                params.entity = await spEntityPortalService.newEntity(
                    pageContext.legacyPageContext.groupId,
                    pageContext.web.absoluteUrl,
                    { Title: pageContext.web.title, GtSiteId: pageContext.site.id.toString() },
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