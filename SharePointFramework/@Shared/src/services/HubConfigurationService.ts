import { Web, List } from '@pnp/sp';
import { SPProjectColumnConfigItem, SPProjectColumnItem, ProjectColumnConfig } from '../models';
import { default as initSpfxJsom, ExecuteJsomQuery } from 'spfx-jsom';
import { parseFieldXml } from '../helpers/parseFieldXml';

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
     */
    public async syncList(url: string, listName: string, contentTypeId: string) {
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
        return ensureList.list;
    }

    /**
     * Get hub content type
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
     * Get site fields internal names
     * 
     * @param {Web} web Web
     */
    private async _getSiteFields(web: Web): Promise<{ InternalName: string }[]> {
        let siteFields = await web.fields.select('InternalName').get<{ InternalName: string }[]>();
        return siteFields;
    }

    /**
   * Get list fields internal names
   * 
   * @param {List} list List
   */
    private async _getListFields(list: List): Promise<{ InternalName: string }[]> {
        let listFields = await list.fields.select('InternalName').get<{ InternalName: string }[]>();
        return listFields;
    }
}