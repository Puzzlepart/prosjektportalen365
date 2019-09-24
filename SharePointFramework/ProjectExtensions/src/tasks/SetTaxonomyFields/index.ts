import * as strings from 'ProjectExtensionsStrings';
import { ExecuteJsomQuery } from 'spfx-jsom';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';

export default new class SetTaxonomyFields extends BaseTask {
    public taskName = 'SetTaxonomyFields';
    
    /**
     * Execute CopyListData
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            let { spfxJsomContext: { jsomContext, defaultTermStore } } = params;
            await ExecuteJsomQuery(jsomContext, [{ clientObject: defaultTermStore, exps: 'Id' }]);
            this.logInformation(`Retrieved ID ${defaultTermStore.get_id()} for default term store`);
            Object.keys(params.properties.termSetIds).forEach(fieldName => {
                const termSetId = params.properties.termSetIds[fieldName];
                this.logInformation(`Setting Term Set ID ${termSetId} for ${fieldName}`);
                const field: SP.Field = jsomContext.rootWeb.get_fields().getByInternalNameOrTitle(fieldName);
                const taxField: SP.Taxonomy.TaxonomyField = jsomContext.clientContext.castTo(field, SP.Taxonomy.TaxonomyField) as SP.Taxonomy.TaxonomyField;
                taxField.set_sspId(defaultTermStore.get_id());
                taxField.set_termSetId(new SP.Guid(termSetId));
                taxField.updateAndPushChanges(true);
            });
            await ExecuteJsomQuery(jsomContext);
            return params;
        } catch (error) {
            throw new BaseTaskError(this.taskName, strings.SetTaxonomyFieldsErrorMessage, error);
        }
    }
};