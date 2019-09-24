import { List, Web } from '@pnp/sp';
import * as strings from 'ProjectExtensionsStrings';
import { ExecuteJsomQuery } from 'spfx-jsom';
import { default as ProvisionSiteFields } from 'tasks/ProvisionSiteFields';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { parseFieldXml } from 'shared/lib/helpers';

export default new class SetupProjectInformation extends BaseTask {
    public taskName = 'SetupProjectInformation';
    private _listName = strings.ProjectPropertiesListName;

    /**
     * Executes the SetupProjectInformation task
     * 
     * @param {IBaseTaskParams} params Task parameters
     * @param {OnProgressCallbackFunction} _onProgress On progress funtion (not currently in use by this task)
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            onProgress(strings.SetupProjectInformationText, 'AlignCenter');
            const propertiesList = await this._createPropertiesList(params);
            await propertiesList.items.add({ Title: params.context.pageContext.web.title });
            await this._addEntryToHub(params);
            return params;
        } catch (error) {
            throw new BaseTaskError(this.taskName, strings.SetupProjectInformationErrorMessage, error);
        }
    }

    /**
     * Add entry to hub
     * 
     * @param {IBaseTaskParams} param0 Parameters destructed
     */
    private async _addEntryToHub({ spEntityPortalService, data, properties, context }: IBaseTaskParams) {
        this.logInformation(`Attempting to retrieve project item from list '${properties.projectsList}' at ${data.hub.url}`, { groupId: context.pageContext.legacyPageContext.groupId, siteId: context.pageContext.site.id.toString() });
        let entity = await spEntityPortalService.getEntityItem(context.pageContext.legacyPageContext.groupId);
        if (entity) return;
        this.logInformation(`Adding project to list '${properties.projectsList}' at ${data.hub.url}`, { groupId: context.pageContext.legacyPageContext.groupId, siteId: context.pageContext.site.id.toString() });
        await spEntityPortalService.newEntity(
            context.pageContext.legacyPageContext.groupId,
            context.pageContext.web.absoluteUrl,
            { Title: context.pageContext.web.title, GtSiteId: context.pageContext.site.id.toString() },
        );
        this.logInformation(`Project added to list '${properties.projectsList}' at ${data.hub.url}`, {});
    }

    /**
     * Create properties list
     * 
     * @param {IBaseTaskParams} param0 Task parameters destructed
     */
    private async _createPropertiesList({ data, web, spfxJsomContext: { jsomContext } }: IBaseTaskParams): Promise<List> {
        const [contentType, siteFields, ensureList] = await Promise.all([
            this._getHubContentType(data.hub.web),
            this._getSiteFields(web),
            web.lists.ensure(this._listName, undefined, 100, false, { Hidden: true, EnableAttachments: false }),
        ]);
        const listFields = await this._getListFields(ensureList.list);
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
                    let newField = spList.get_fields().addFieldAsXml(parseFieldXml(field, { DisplayName: field.InternalName }), false, SP.AddFieldOptions.addToDefaultContentType);
                    newField.set_title(field.Title);
                    newField.updateAndPushChanges(true);
                }
                await ExecuteJsomQuery(jsomContext);
            } catch (error) { }
        }
        return ensureList.list;
    }

    /**
     * Get hub content types
     * 
     * @param {Web} web Web
     */
    private async _getHubContentType(web: Web) {
        let contentType = await web.contentTypes
            .getById('0x0100805E9E4FEAAB4F0EABAB2600D30DB70C')
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
        let siteFields = await web.fields.select('InternalName').get<{ InternalName: string }[]>();
        return siteFields;
    }

    /**
   * Get list fields
   * 
   * @param {List} list List
   */
    private async _getListFields(list: List): Promise<{ InternalName: string }[]> {
        let listFields = await list.fields.select('InternalName').get<{ InternalName: string }[]>();
        return listFields;
    }
};