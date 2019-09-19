import { override } from '@microsoft/decorators';
import { task } from 'decorators/task';
import * as strings from 'ProjectExtensionsStrings';
import initSpfxJsom from 'spfx-jsom';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { SpEntityPortalService } from 'sp-entityportal-service';

@task('PreTask')
export default class PreTask extends BaseTask {
    @override
    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            params.spfxJsomContext = await initSpfxJsom(params.context.pageContext.site.absoluteUrl, { loadTaxonomy: true });
            params.spEntityPortalService = new SpEntityPortalService({
                webUrl: params.data.hub.url,
                listName: params.properties.projectsList,
                identityFieldName: 'GtGroupId',
                urlFieldName: 'GtSiteUrl',
            });
            return params;
        } catch (error) {
            throw new BaseTaskError(this.name, strings.PreTaskErrorMessage, error);
        }
    }
}