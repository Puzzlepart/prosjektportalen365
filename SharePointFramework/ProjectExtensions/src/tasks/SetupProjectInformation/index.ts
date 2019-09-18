import { override } from '@microsoft/decorators';
import { task } from 'decorators/task';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import { ExecuteJsomQuery, JsomContext } from 'spfx-jsom';
import { default as ProvisionSiteFields } from 'tasks/ProvisionSiteFields';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { Web, List } from '@pnp/sp';

@task('SetupProjectInformation')
export default class SetupProjectInformation extends BaseTask {
    private _contentTypeId = '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C';
    private _listName = 'Prosjektegenskaper';

    /**
     * Executes the SetupProjectInformation task
     * 
     * @param {IBaseTaskParams} params Task parameters
     * @param {OnProgressCallbackFunction} _onProgress On progress funtion (not currently in use by this task)
     */
    @override
    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            const { web, spfxJsomContext: { jsomContext } } = params;
            const [contentType, siteFields, { list }] = await Promise.all([
                this._getHubContentType(params.data.hub.web),
                this._getSiteFields(params.web),
                web.lists.ensure(this._listName, undefined, 100, false, { Hidden: true, EnableAttachments: false }),
            ]);
            const listFields = await this._getListFields(list);
            const spList = jsomContext.web.get_lists().getByTitle(this._listName);
            for (let field of contentType.Fields) {
                let [listField] = listFields.filter(fld => fld.InternalName === field.InternalName);
                if (listField) continue;
                let [siteField] = siteFields.filter(fld => fld.InternalName === field.InternalName);
                try {
                    if (siteField) {
                        this.logInformation(`Adding field ${field.InternalName} to list ${this._listName}`, {});
                        let spSiteField = jsomContext.web.get_fields().getByInternalNameOrTitle(siteField.InternalName);
                        spList.get_fields().add(spSiteField);
                    } else {
                        this.logInformation(`Adding field ${field.InternalName} to list ${this._listName} as XML`, {});
                        let newField = spList.get_fields().addFieldAsXml(ProvisionSiteFields.parseFieldXml(field, { DisplayName: field.InternalName }), false, SP.AddFieldOptions.addToDefaultContentType);
                        newField.set_title(field.Title);
                        newField.updateAndPushChanges(true);
                    }
                    await ExecuteJsomQuery(jsomContext);
                } catch (error) { }
            }
            await list.items.add({ Title: params.context.pageContext.web.title });
            return params;
        } catch (error) {
            throw new BaseTaskError(this.name, strings.SetupProjectInformationErrorMessage, error);
        }
    }

    /**
     * Get hub content types
     * 
     * @param {Web} web Web
     */
    private async _getHubContentType(web: Web) {
        let contentType = await web.contentTypes
            .getById(this._contentTypeId)
            .select('StringId', 'Name', 'Fields/InternalName', 'Fields/Title', 'Fields/SchemaXml')
            .expand('Fields')
            .get<{ StringId: string, Name: string, Fields: { InternalName: string, Title: string, SchemaXml: string }[] }>();
        return contentType;
    }

    /**
     * Get site fields
     * 
     * @param {Web} web Web
     */
    private async _getSiteFields(web: Web): Promise<{ InternalName: string }[]> {
        let siteFields = await web.fields.select('InternalName').get();
        return siteFields;
    }

    /**
   * Get list fields
   * 
   * @param {List} list List
   */
    private async _getListFields(list: List): Promise<{ InternalName: string }[]> {
        let listFields = await list.fields.select('InternalName').get();
        return listFields;
    }
}