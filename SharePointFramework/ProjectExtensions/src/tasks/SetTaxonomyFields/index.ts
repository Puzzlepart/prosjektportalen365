import { override } from '@microsoft/decorators';
import { task } from 'decorators/task';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import initSpfxJsom, { ExecuteJsomQuery, JsomContext, ISpfxJsomContext } from 'spfx-jsom';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';

@task('SetTaxonomyFields')
export default class SetTaxonomyFields extends BaseTask {
    /**
     * Execute CopyListData
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    @override
    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            let { web, spfxJsomContext: { jsomContext, defaultTermStore } } = params;
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
            throw new BaseTaskError(this.name, strings.SetTaxonomyFieldsErrorMessage, error);
        }
    }
}
