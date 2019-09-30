import { CamlQuery, List, Web } from '@pnp/sp';
import { TypedHash } from '@pnp/common';
import { default as initSpfxJsom, ExecuteJsomQuery } from 'spfx-jsom';
import { parseFieldXml } from '../helpers/parseFieldXml';
import { ProjectColumnConfig, SPProjectColumnConfigItem, SPProjectColumnItem } from '../models';
import { ISPField, ISPContentType } from '../interfaces';

export class HubConfigurationService {
    private web: Web;

    constructor(urlOrWeb: string | Web) {
        if (typeof urlOrWeb === 'string') {
            this.web = new Web(urlOrWeb);
        } else {
            this.web = urlOrWeb;
        }
    }

    /**
     * Get project columns
     */
    public getProjectColumns(): Promise<SPProjectColumnItem[]> {
        return this.web.lists.getByTitle('Prosjektkolonner')
            .items
            .select(...Object.keys(new SPProjectColumnItem()))
            .get<SPProjectColumnItem[]>();
    }

    /**
     * Get project column configuration
     */
    public async getProjectColumnConfig(): Promise<ProjectColumnConfig[]> {
        let spItems = await this.web.lists.getByTitle('Prosjektkolonnekonfigurasjon').items
            .orderBy('ID', true)
            .expand('GtPortfolioColumn')
            .select(...Object.keys(new SPProjectColumnConfigItem()), 'GtPortfolioColumn/Title', 'GtPortfolioColumn/GtInternalName')
            .get<SPProjectColumnConfigItem[]>();
        return spItems.map(c => new ProjectColumnConfig(c));;
    }

    /**
     * Sync list from hub to the specified url
     * 
     * @param {string} url Url
     * @param {stirng} listName List name 
     * @param {string} contentTypeId Content type id
     * @param {TypedHash} properties Create a new item in the list with specified properties if the list was created
     */
    public async syncList(url: string, listName: string, contentTypeId: string, properties?: TypedHash<string>) {
        const { jsomContext } = await initSpfxJsom(url, { loadTaxonomy: true });
        const [contentType, siteFields, ensureList] = await Promise.all([
            this._getHubContentType(this.web, contentTypeId),
            this._getSiteFields(new Web(url)),
            new Web(url).lists.ensure(listName, undefined, 100, false, { Hidden: true, EnableAttachments: false }),
        ]);
        const listFields = await this._getListFields(ensureList.list);
        const spList = jsomContext.web.get_lists().getByTitle(listName);
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
        if (ensureList.created && properties) {
            ensureList.list.items.add(properties);
        }
        return ensureList.list;
    }

    /**
     * Get hub content type
     * 
     * @param {Web} web Web
     * @param {string} contentTypeId Content type ID
     */
    private async _getHubContentType(web: Web, contentTypeId: string): Promise<ISPContentType> {
        let contentType = await web.contentTypes
            .getById(contentTypeId)
            .select('StringId', 'Name', 'Fields/InternalName', 'Fields/Title', 'Fields/SchemaXml', 'Fields/InternalName')
            .expand('Fields')
            .get<ISPContentType>();
        return contentType;
    }

    /**
     * Get site fields internal names
     * 
     * @param {Web} web Web
     */
    private async _getSiteFields(web: Web): Promise<ISPField[]> {
        let siteFields = await web.fields.select('InternalName', 'Title', 'SchemaXml', 'InternalName').get<ISPField[]>();
        return siteFields;
    }

    /**
   * Get list fields internal names
   * 
   * @param {List} list List
   */
    private async _getListFields(list: List): Promise<ISPField[]> {
        let listFields = await list.fields.select('InternalName', 'Title', 'SchemaXml', 'InternalName').get<ISPField[]>();
        return listFields;
    }


    /**
     * Get hub files
     * 
     * @param {string} listName List name 
     * @param {T} constructor Constructor
     */
    public async getHubFiles<T>(listName: string, constructor: new (file: any, web: Web) => T): Promise<T[]> {
        const files = await this.web.lists.getByTitle(listName).rootFolder.files.usingCaching().get();
        return files.map(file => new constructor(file, this.web));
    }

    /**
     * Get hub items
     * 
     * @param {string} listName List name 
     * @param {T} constructor Constructor
     * @param {CamlQuery} query Query
     * @param {string[]} expands Expands
     */
    public async getHubItems<T>(listName: string, constructor: new (item: any, web: Web) => T, query?: CamlQuery, expands?: string[]): Promise<T[]> {
        try {
            let items: any[];
            if (query) {
                items = await this.web.lists.getByTitle(listName).usingCaching().usingCaching().getItemsByCAMLQuery(query, ...expands);
            } else {
                items = await this.web.lists.getByTitle(listName).usingCaching().items.usingCaching().get();
            }
            return items.map(item => new constructor(item, this.web));
        } catch (error) {
            throw error;
        }
    }
}