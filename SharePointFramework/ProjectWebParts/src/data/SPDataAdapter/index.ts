import { WebPartContext } from '@microsoft/sp-webpart-base';
import { dateAdd, stringIsNullOrEmpty, TypedHash } from '@pnp/common';
import { ItemUpdateResult, List, sp, SPConfiguration, Web } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import { ChecklistData } from 'components/ProjectPhases/ChecklistData';
import { IPhaseChecklistItem } from 'models';
import { ISPList } from 'models/ISPList';
import { Phase } from 'models/Phase';
import * as strings from 'ProjectWebPartsStrings';
import { makeUrlAbsolute, parseFieldXml } from 'shared/lib/helpers';
import initSpfxJsom, { ExecuteJsomQuery } from 'spfx-jsom';
import * as _ from 'underscore';
import { IGetPropertiesData } from './IGetPropertiesData';
import { ISPDataAdapterSettings } from './ISPDataAdapterSettings';

export default new class SPDataAdapter {
    public spConfiguration: SPConfiguration = {
        defaultCachingStore: 'session',
        defaultCachingTimeoutSeconds: 90,
        enableCacheExpiration: true,
        cacheExpirationIntervalMilliseconds: 2500,
        globalCacheDisable: false,
    };
    private _settings: ISPDataAdapterSettings = {
        spEntityPortalService: null,
        siteId: '',
        webUrl: '',
    };

    /**
     * Configure
     * 
     * @param spfxContext 
     * @param settings 
     */
    public configure(spfxContext: WebPartContext, settings: ISPDataAdapterSettings) {
        this._settings = settings;
        sp.setup({ spfxContext, ...this.spConfiguration });
    }

    /**
     * Create properties list
     */
    private async _createPropertiesList(): Promise<List> {
        try {
            let { jsomContext } = await initSpfxJsom(this._settings.webUrl, { loadTaxonomy: true });
            const [contentType, siteFields, ensureList] = await Promise.all([
                this._getHubContentType(new Web(this._settings.hubSiteUrl), '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C'),
                this._getSiteFields(sp.web),
                sp.web.lists.ensure(strings.ProjectPropertiesListName, undefined, 100, false, { Hidden: true, EnableAttachments: false }),
            ]);
            const listFields = await this._getListFields(ensureList.list);
            const spList = jsomContext.web.get_lists().getByTitle(strings.ProjectPropertiesListName);
            for (let field of contentType.Fields) {
                let [listField] = listFields.filter(fld => fld.InternalName === field.InternalName);
                if (listField) continue;
                let [siteField] = siteFields.filter(fld => fld.InternalName === field.InternalName);
                try {
                    if (siteField) {
                        let spSiteField = jsomContext.web.get_fields().getByInternalNameOrTitle(siteField.InternalName);
                        spList.get_fields().add(spSiteField);
                    } else {
                        let newField = spList.get_fields().addFieldAsXml(parseFieldXml(field, { DisplayName: field.InternalName }), false, SP.AddFieldOptions.addToDefaultContentType);
                        newField.set_title(field.Title);
                        newField.updateAndPushChanges(true);
                    }
                    await ExecuteJsomQuery(jsomContext);
                } catch (error) { }
            }
            return ensureList.list;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get hub content types
     * 
     * @param {Web} web Web
     * @param {string} contentTypeId Content type ID
     */
    private async _getHubContentType(web: Web, contentTypeId: string) {
        let contentType = await web.contentTypes
            .getById(contentTypeId)
            .select('StringId', 'Name', 'Fields/InternalName', 'Fields/Title', 'Fields/SchemaXml')
            .expand('Fields')
            .get<{ StringId: string, Name: string, Fields: { InternalName: string, Title: string, SchemaXml: string }[] }>();
        return contentType;
    }

    /**
     * Get site fields for the specifiec web
     * 
     * @param {Web} web Web
     */
    private async _getSiteFields(web: Web) {
        let siteFields = await web.fields.select('InternalName').get<{ InternalName: string }[]>();
        return siteFields;
    }

    /**
   * Get list fields for the specified list
   * 
   * @param {List} list List
   */
    private async _getListFields(list: List) {
        let listFields = await list.fields.select('InternalName').get<{ InternalName: string }[]>();
        return listFields;
    }

    /**
     * Sync property item from site to associated hub
     * 
     * @param {any[]} fields Fields
     * @param {TypedHash} fieldValues Field values for the properties item
     * @param {TypedHash} fieldValuesText Field values in text format for the properties item
     * @param {void} progressFunc Progress function
     */
    public async syncPropertyItemToHub(fields: any[], fieldValues: TypedHash<any>, fieldValuesText: TypedHash<string>, progressFunc: ({ description: string }) => void): Promise<ItemUpdateResult> {
        try {
            progressFunc({ description: strings.SyncProjectPropertiesListProgressDescription });
            await this._createPropertiesList();
            progressFunc({ description: strings.SyncProjectPropertiesValuesProgressDescription });
            const fieldToSync = fields.filter(fld => fld.InternalName.indexOf('Gt') === 0);
            const properties = _.omit(fieldToSync.reduce((obj, fld) => {
                let fieldValue = fieldValuesText[fld.InternalName];
                if (stringIsNullOrEmpty(fieldValue)) return obj;
                switch (fld.TypeAsString) {
                    case 'TaxonomyFieldType': case 'TaxonomyFieldTypeMulti': {
                        let [textField] = fields.filter(f => f.Id === fld.TextField);
                        if (textField) {
                            obj[textField.InternalName] = fieldValuesText[textField.InternalName];
                        }
                    }
                        break;
                    case 'User': {
                        obj[`${fld.InternalName}Id`] = fieldValues[`${fld.InternalName}Id`];
                    }
                        break;
                    case 'DateTime': {
                        obj[fld.InternalName] = new Date(fieldValues[fld.InternalName]);
                    }
                        break;
                    case 'Currency': {
                        obj[fld.InternalName] = fieldValues[fld.InternalName];
                    }
                        break;
                    default: {
                        obj[fld.InternalName] = fieldValue;
                    }
                        break;
                }
                return obj;
            }, {}), ['GtSiteId', 'GtGroupId', 'GtSiteUrl']);
            return await this._settings.spEntityPortalService.updateEntityItem(this._settings.siteId, properties);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get property item context from site
     */
    private async _getPropertyItemContext() {
        try {
            let [list] = await sp.web.lists.filter(`Title eq '${strings.ProjectPropertiesListName}'`).select('Id', 'DefaultEditFormUrl').usingCaching().get<ISPList[]>();
            if (!list) return null;
            let [item] = await sp.web.lists.getById(list.Id).items.select('Id').top(1).usingCaching().get<{ Id: number }[]>();
            if (!item) return null;
            return {
                id: item.Id,
                list: sp.web.lists.getById(list.Id),
                item: sp.web.lists.getById(list.Id).items.getById(item.Id),
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
                propertyItemContext.item.fieldValuesAsText.get(),
                propertyItemContext.item.get(),
                propertyItemContext.list.fields.select('Id', 'InternalName', 'Title', 'TypeAsString', 'SchemaXml', 'TextField').filter(`substringof('Gt', InternalName)`).usingCaching().get(),
            ]);
            let editFormUrl = makeUrlAbsolute(`${propertyItemContext.defaultEditFormUrl}?ID=${propertyItemContext.id}&Source=${urlSource}`);
            let versionHistoryUrl = `${this._settings.webUrl}/_layouts/15/versions.aspx?list=${propertyItemContext.listId}&ID=${propertyItemContext.id}`;
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
    public async getPropertiesData(): Promise<IGetPropertiesData> {
        let propertyItem = await this._getPropertyItem();
        // tslint:disable-next-line: early-exit
        if (propertyItem) {
            return propertyItem;
        } else {
            let entity = await this._settings.spEntityPortalService.configure(this.spConfiguration).fetchEntity(this._settings.siteId, this._settings.webUrl);
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
    public async updatePhase(phase: Phase, phaseTextField: string): Promise<void> {
        let properties = { [phaseTextField]: phase.toString() };
        try {
            let propertyItemContext = await this._getPropertyItemContext();
            if (propertyItemContext) {
                await propertyItemContext.item.update(properties);
            } else {
                await this._settings.spEntityPortalService.updateEntityItem(this._settings.siteId, properties);
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
    public async getPhases(termSetId: string, checklistData: ChecklistData = {}) {
        let terms = await taxonomy.getDefaultSiteCollectionTermStore()
            .getTermSetById(termSetId)
            .terms
            .select('Id', 'Name', 'LocalCustomProperties')
            .usingCaching({
                key: `projectphases_terms`,
                storeName: 'session',
                expiration: dateAdd(new Date(), 'day', 1),
            })
            .get();
        return terms.map(term => new Phase(term.Name, term.Id, checklistData[term.Id], term.LocalCustomProperties));
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
     * @param {List} list List
     */
    public async getChecklistData(list: List): Promise<ChecklistData> {
        try {
            const items = await list
                .items
                .select(
                    'ID',
                    'Title',
                    'GtComment',
                    'GtChecklistStatus',
                    'GtProjectPhase'
                )
                .get<IPhaseChecklistItem[]>();
            const checklistData: ChecklistData = items
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
     * Fetch term field context
     * 
     * @param {string} fieldName Field name for phase
     */
    public async getTermFieldContext(fieldName: string) {
        const [phaseField, textField] = await Promise.all([
            sp.web.fields.getByInternalNameOrTitle(fieldName)
                .select('TermSetId')
                .usingCaching()
                .get<{ TermSetId: string }>(),
            sp.web.fields.getByInternalNameOrTitle(`${fieldName}_0`)
                .select('InternalName')
                .usingCaching()
                .get<{ InternalName: string }>(),
        ]);
        return { termSetId: phaseField.TermSetId, phaseTextField: textField.InternalName };
    }
};