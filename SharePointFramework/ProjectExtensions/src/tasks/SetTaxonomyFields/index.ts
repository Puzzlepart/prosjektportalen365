import { override } from '@microsoft/decorators';
import { task } from 'decorators/task';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import initSpfxJsom, { ExecuteJsomQuery, JsomContext } from 'spfx-jsom';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';

@task('SetTaxonomyFields')
export default class SetTaxonomyFields extends BaseTask {
    /**
     * Execute CopyListData
     * 
     * @param {IBaseTaskParams} params Params 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    @override
    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            const jsomCtx: JsomContext = await initSpfxJsom(params.context.pageContext.site.absoluteUrl, { loadTaxonomy: true });
            const taxSession = SP.Taxonomy.TaxonomySession.getTaxonomySession(jsomCtx.clientContext);
            const defaultSiteCollectionTermStore = taxSession.getDefaultSiteCollectionTermStore();
            await ExecuteJsomQuery(jsomCtx, [{ clientObject: defaultSiteCollectionTermStore, exps: 'Id' }]);
            this.logInformation(`Retrieved ID ${defaultSiteCollectionTermStore.get_id()} for default term store`);
            Object.keys(params.properties.termSetIds).forEach(fldInternalName => {
                const termSetId = params.properties.termSetIds[fldInternalName];
                this.logInformation(`Setting Term Set ID ${termSetId} for ${fldInternalName}`);
                const field: SP.Field = jsomCtx.rootWeb.get_fields().getByInternalNameOrTitle(fldInternalName);
                const taxField: SP.Taxonomy.TaxonomyField = jsomCtx.clientContext.castTo(field, SP.Taxonomy.TaxonomyField) as SP.Taxonomy.TaxonomyField;
                taxField.set_sspId(defaultSiteCollectionTermStore.get_id());
                taxField.set_termSetId(new SP.Guid(termSetId));
                taxField.updateAndPushChanges(true);
            });
            await ExecuteJsomQuery(jsomCtx);
            return params;
        } catch (error) {
            throw new BaseTaskError(this.name, strings.SetTaxonomyFieldsErrorMessage, error);
        }
    }
}
