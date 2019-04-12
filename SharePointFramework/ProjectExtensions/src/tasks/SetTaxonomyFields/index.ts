import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import { override } from '@microsoft/decorators';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { Logger, LogLevel } from '@pnp/logging';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { BaseTaskError } from '../BaseTaskError';
import initSpfxJsom, { ExecuteJsomQuery, JsomContext } from 'spfx-jsom';

export default class SetTaxonomyFields extends BaseTask {
    constructor() {
        super('SetTaxonomyFields');
    }

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
            Logger.log({ message: `(ProjectSetupApplicationCustomizer) SetTaxonomyFields: Retrieved ID ${defaultSiteCollectionTermStore.get_id()} for default term store`, level: LogLevel.Info });
            Object.keys(params.properties.termSetIds).forEach(fldInternalName => {
                const termSetId = params.properties.termSetIds[fldInternalName];
                Logger.log({ message: `(ProjectSetupApplicationCustomizer) SetTaxonomyFields: Setting Term Set ID ${termSetId} for ${fldInternalName}`, level: LogLevel.Info });
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
