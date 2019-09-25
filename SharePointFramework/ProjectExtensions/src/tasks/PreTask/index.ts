import { task } from 'decorators/task';
import * as strings from 'ProjectExtensionsStrings';
import { SpEntityPortalService } from 'sp-entityportal-service';
import initSpfxJsom from 'spfx-jsom';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { HubConfigurationService } from 'shared/lib/services';

export default new class PreTask extends BaseTask {
    public taskName = 'PreTask';

    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            params.spfxJsomContext = await initSpfxJsom(params.context.pageContext.site.absoluteUrl, { loadTaxonomy: true });
            params.spEntityPortalService = new SpEntityPortalService({
                webUrl: params.data.hub.url,
                listName: params.properties.projectsList,
                identityFieldName: 'GtGroupId',
                urlFieldName: 'GtSiteUrl',
            });
            params.hubConfigurationService = new HubConfigurationService(params.data.hub.web);
            return params;
        } catch (error) {
            throw new BaseTaskError(this.taskName, strings.PreTaskErrorMessage, error);
        }
    }
};