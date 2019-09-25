import * as strings from 'ProjectExtensionsStrings';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';

export default new class SetupProjectInformation extends BaseTask {
    public taskName = 'SetupProjectInformation';
    private _propertiesCtId: string;

    constructor() {
        super();
        this._propertiesCtId = '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C';
    }

    /**
     * Executes the SetupProjectInformation task
     * 
     * @param {IBaseTaskParams} params Task parameters
     * @param {OnProgressCallbackFunction} _onProgress On progress funtion (not currently in use by this task)
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            onProgress(strings.SetupProjectInformationText, 'AlignCenter');
            this.logInformation(`Synchronizing list '${strings.ProjectPropertiesListName}' based on content type ${this._propertiesCtId} from ${params.data.hub.url} `, {});
            const propertiesList = await params.hubConfigurationService.syncList(params.webAbsoluteUrl, strings.ProjectPropertiesListName, this._propertiesCtId);
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
        this.logInformation(`Attempting to retrieve project item from list '${properties.projectsList}' at ${data.hub.url}`);
        let entity = await spEntityPortalService.getEntityItem(context.pageContext.legacyPageContext.groupId);
        if (entity) return;
        this.logInformation(`Adding project entity to list '${properties.projectsList}' at ${data.hub.url}`, { groupId: context.pageContext.legacyPageContext.groupId, siteId: context.pageContext.site.id.toString() });
        await spEntityPortalService.newEntity(
            context.pageContext.legacyPageContext.groupId,
            context.pageContext.web.absoluteUrl,
            { Title: context.pageContext.web.title, GtSiteId: context.pageContext.site.id.toString() },
        );
        this.logInformation(`Project entity added to list '${properties.projectsList}' at ${data.hub.url}`, {});
    }
};