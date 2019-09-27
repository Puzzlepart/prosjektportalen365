import { dateAdd, TypedHash } from '@pnp/common';
import { SPConfiguration, SPRest } from '@pnp/sp';
import { ITaxonomySession } from '@pnp/sp-taxonomy';
import { SpEntityPortalService } from 'sp-entityportal-service';
import { makeUrlAbsolute } from '../helpers/makeUrlAbsolute';
import { ISPList } from '../interfaces/ISPList';
import { IProjectPhaseChecklistItem, ProjectPhaseChecklistData, ProjectPhaseModel } from '../models';

export interface IProjectDataServiceParams {
    webUrl: string;
    siteId: string;
    spEntityPortalService: SpEntityPortalService;
    propertiesListName: string;
    sp: SPRest
    taxonomy?: ITaxonomySession
}

export class ProjectDataService {
    public spConfiguration: SPConfiguration;

    /**
     * Creates a new instance of ProjectDataService
     * 
     * @param {IProjectDataServiceParams} _params Parameters
     */
    constructor(private _params: IProjectDataServiceParams) { }


    /**
     * Get property item context from site
     */
    private async _getPropertyItemContext() {
        try {
            let [list] = await this._params.sp.web.lists.filter(`Title eq '${this._params.propertiesListName}'`).select('Id', 'DefaultEditFormUrl').usingCaching().get<ISPList[]>();
            if (!list) return null;
            let [item] = await this._params.sp.web.lists.getById(list.Id).items.select('Id').top(1).usingCaching().get<{ Id: number }[]>();
            if (!item) return null;
            return {
                id: item.Id,
                list: this._params.sp.web.lists.getById(list.Id),
                item: this._params.sp.web.lists.getById(list.Id).items.getById(item.Id),
                listId: list.Id,
                defaultEditFormUrl: list.DefaultEditFormUrl,
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Get property item from site
     * 
     * @param {string} urlSource Url source
     */
    private async _getPropertyItem(urlSource: string = encodeURIComponent(document.location.href)) {
        try {
            let propertyItemContext = await this._getPropertyItemContext();
            if (!propertyItemContext) return null;
            let [fieldValuesText, fieldValues, fields] = await Promise.all([
                propertyItemContext
                    .item
                    .fieldValuesAsText
                    .get(),
                propertyItemContext
                    .item
                    .get(),
                propertyItemContext
                    .list
                    .fields
                    .select('Id', 'InternalName', 'Title', 'Description', 'TypeAsString', 'SchemaXml', 'TextField')
                    .filter(`substringof('Gt', InternalName)`)
                    .usingCaching()
                    .get(),
            ]);
            let editFormUrl = makeUrlAbsolute(`${propertyItemContext.defaultEditFormUrl}?ID=${propertyItemContext.id}&Source=${urlSource}`);
            let versionHistoryUrl = `${this._params.webUrl}/_layouts/15/versions.aspx?list=${propertyItemContext.listId}&ID=${propertyItemContext.id}`;
            return {
                fieldValuesText,
                fieldValues,
                editFormUrl,
                versionHistoryUrl,
                fields,
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Get properties data
     */
    public async getPropertiesData() {
        let propertyItem = await this._getPropertyItem();
        // tslint:disable-next-line: early-exit
        if (propertyItem) {
            return propertyItem;
        } else {
            let entity = await this._params.spEntityPortalService.configure(this.spConfiguration).fetchEntity(this._params.siteId, this._params.webUrl);
            return {
                editFormUrl: entity.urls.editFormUrl,
                versionHistoryUrl: entity.urls.versionHistoryUrl,
                fieldValues: entity.fieldValues,
                fieldValuesText: entity.fieldValues,
                fields: entity.fields,
            };
        }
    }

    /**
     * Update phase
     * 
     * @param {Phase} phase Phase
     * @param {string} phaseTextField Phase text field
     */
    public async updatePhase(phase: ProjectPhaseModel, phaseTextField: string): Promise<void> {
        let properties = { [phaseTextField]: phase.toString() };
        try {
            let propertyItemContext = await this._getPropertyItemContext();
            if (propertyItemContext) {
                await propertyItemContext.item.update(properties);
            } else {
                await this._params.spEntityPortalService.updateEntityItem(this._params.siteId, properties);
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get phases
     * 
     * @param {string} termSetId Get phases
     * @param {ChecklistData} checklistData Checklist data
     */
    public async getPhases(termSetId: string, checklistData: { [termGuid: string]: ProjectPhaseChecklistData } = {}): Promise<ProjectPhaseModel[]> {
        let terms = await this._params.taxonomy.getDefaultSiteCollectionTermStore()
            .getTermSetById(termSetId)
            .terms
            .select('Id', 'Name', 'LocalCustomProperties')
            .usingCaching({
                key: `projectphases_terms`,
                storeName: 'session',
                expiration: dateAdd(new Date(), 'day', 1),
            })
            .get();
        return terms.map((term) => new ProjectPhaseModel(term.Name, term.Id, checklistData[term.Id], term.LocalCustomProperties));
    }

    /**
     * Get current phase
     */
    public async getCurrentPhaseName(): Promise<string> {
        let propertiesData = await this.getPropertiesData();
        return propertiesData.fieldValuesText.GtProjectPhase;
    }

    /**
     * Get checklist data
     * 
     * @param {string} listName List name
     */
    public async getChecklistData(listName: string): Promise<{ [termGuid: string]: ProjectPhaseChecklistData }> {
        try {
            const items = await this._params.sp.web.lists.getByTitle(listName)
                .items
                .select(
                    'ID',
                    'Title',
                    'GtComment',
                    'GtChecklistStatus',
                    'GtProjectPhase'
                )
                .get<IProjectPhaseChecklistItem[]>();
            const checklistData = items
                .filter(item => item.GtProjectPhase)
                .reduce((obj, item) => {
                    const status = item.GtChecklistStatus.toLowerCase();
                    const termId = `/Guid(${item.GtProjectPhase.TermGuid})/`;
                    obj[termId] = obj[termId] ? obj[termId] : {};
                    obj[termId].stats = obj[termId].stats || {};
                    obj[termId].items = obj[termId].items || [];
                    obj[termId].items.push(item);
                    obj[termId].stats[status] = obj[termId].stats[status] ? obj[termId].stats[status] + 1 : 1;
                    return obj;
                }, {});
            return checklistData;
        } catch (e) {
            return {};
        }
    }

    /**
     * Update checklist item
     * 
     * @param {string} listName List name
     * @param {number} id Id
     * @param {TypedHash} properties Properties 
     */
    public async updateChecklistItem(listName: string, id: number, properties: TypedHash<any>) {
        return await this._params.sp.web.lists.getByTitle(listName).items.getById(id).update(properties);
    }
};