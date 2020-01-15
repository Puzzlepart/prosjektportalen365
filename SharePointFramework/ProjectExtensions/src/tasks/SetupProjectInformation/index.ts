import * as strings from 'ProjectExtensionsStrings';
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask';
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction';

export class SetupProjectInformation extends BaseTask {
    public taskName = 'SetupProjectInformation';
    private _projectCtId: string;

    /**
     * Executes the SetupProjectInformation task
     * 
     * @param {IBaseTaskParams} params Task parameters
     * @param {OnProgressCallbackFunction} onProgress On progress funtion (not currently in use by this task)
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            this._projectCtId = params.templateSchema.Parameters.ProjectContentTypeId || '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C';
            await this._syncPropertiesList(params, onProgress);
            await this._addEntryToHub(params);
            return params;
        } catch (error) {
            throw new BaseTaskError(this.taskName, strings.SetupProjectInformationErrorMessage, error);
        }
    }

    /**
     * Sync properties list
     * 
     * @param {IBaseTaskParams} params Task parameters
     * @param {OnProgressCallbackFunction} onProgress On progress funtion (not currently in use by this task)
     */
    private async _syncPropertiesList(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction) {
        try {
            onProgress(strings.SetupProjectInformationText, strings.SyncLocalProjectPropertiesListText, 'AlignCenter');
            this.logInformation(`Synchronizing list '${strings.ProjectPropertiesListName}' based on content type from ${this.data.hub.url} `, {});
            const { list } = await params.portal.syncList(params.webAbsoluteUrl, strings.ProjectPropertiesListName, this._projectCtId, { SourceContentTypeId: this._projectCtId });
            onProgress(strings.SetupProjectInformationText, strings.CreatingLocalProjectPropertiesListItemText, 'AlignCenter');
            await list.items.add({ Title: params.context.pageContext.web.title });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Add entry to hub
     * 
     * @param {IBaseTaskParams} params Task parameters
     */
    private async _addEntryToHub(params: IBaseTaskParams) {
        try {
            this.logInformation(`Attempting to retrieve project item from list '${params.properties.projectsList}' at ${this.data.hub.url}`);
            let entity = await params.entityService.getEntityItem(params.context.pageContext.legacyPageContext.groupId);
            if (entity) return;
            let item = { Title: params.context.pageContext.web.title, GtSiteId: params.context.pageContext.site.id.toString(), ContentTypeId: this._projectCtId };
            this.logInformation(`Adding project entity to list '${params.properties.projectsList}' at ${this.data.hub.url}`, { item });
            await params.entityService.createNewEntity(
                params.context.pageContext.legacyPageContext.groupId,
                params.context.pageContext.web.absoluteUrl,
                item,
            );
            this.logInformation(`Project entity added to list '${params.properties.projectsList}' at ${this.data.hub.url}`, {});
        } catch (error) {
            throw error;
        }
    }
}