import * as strings from 'ProjectExtensionsStrings'
import { TypedHash } from '@pnp/common'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction'

export class SetupProjectInformation extends BaseTask {
    public taskName = 'SetupProjectInformation';

    /**
     * Executes the SetupProjectInformation task
     * 
     * @param {IBaseTaskParams} params Task parameters
     * @param {OnProgressCallbackFunction} onProgress On progress funtion (not currently in use by this task)
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            await this._syncPropertiesList(params, onProgress)
            await this._addEntryToHub(params)
            return params
        } catch (error) {
            throw new BaseTaskError(this.taskName, strings.SetupProjectInformationErrorMessage, error)
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
            onProgress(strings.SetupProjectInformationText, strings.SyncLocalProjectPropertiesListText, 'AlignCenter')
            this.logInformation(`Synchronizing list '${strings.ProjectPropertiesListName}' based on content type from ${this.data.hub.url} `, {})
            const { list } = await params.portal.syncList(params.webAbsoluteUrl, strings.ProjectPropertiesListName, params.templateSchema.Parameters.ProjectContentTypeId)
            onProgress(strings.SetupProjectInformationText, strings.CreatingLocalProjectPropertiesListItemText, 'AlignCenter')
            await list.items.add({
                Title: params.context.pageContext.web.title,
                TemplateParameters: JSON.stringify(params.templateSchema.Parameters),
            })
        } catch (error) {
            throw error
        }
    }

    /**
     * Add entry to hub
     * 
     * @param {IBaseTaskParams} params Task parameters
     */
    private async _addEntryToHub(params: IBaseTaskParams) {
        try {
            this.logInformation(`Attempting to retrieve project item from list '${params.properties.projectsList}' at ${this.data.hub.url}`)
            const entity = await params.entityService.getEntityItem(params.context.pageContext.legacyPageContext.groupId)
            if (entity) return
            const item: TypedHash<any> = {
                Title: params.context.pageContext.web.title,
                GtSiteId: params.context.pageContext.site.id.toString(),
            }
            if (params.templateSchema.Parameters.ProjectContentTypeId) {
                item.ContentTypeId = params.templateSchema.Parameters.ProjectContentTypeId
            }
            this.logInformation(`Adding project entity to list '${params.properties.projectsList}' at ${this.data.hub.url}`, { item })
            await params.entityService.createNewEntity(
                params.context.pageContext.legacyPageContext.groupId,
                params.context.pageContext.web.absoluteUrl,
                item,
            )
            this.logInformation(`Project entity added to list '${params.properties.projectsList}' at ${this.data.hub.url}`, {})
        } catch (error) {
            throw error
        }
    }
}