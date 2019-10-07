import { CamlQuery, List, Web, } from '@pnp/sp';
import { TypedHash, dateAdd, stringIsNullOrEmpty } from '@pnp/common';
import { default as initSpfxJsom, ExecuteJsomQuery } from 'spfx-jsom';
import { transformFieldXml } from '../../helpers/transformFieldXml';
import { ProjectColumnConfig, SPProjectColumnConfigItem, SPProjectColumnItem, StatusReport, SectionModel, ProjectColumn, PortfolioOverviewView, SPPortfolioOverviewViewItem, SPField } from '../../models';
import { ISPField, ISPContentType } from '../../interfaces';
import { HubConfigurationServiceDefaultConfiguration, IHubConfigurationServiceConfiguration, HubConfigurationServiceList } from './IHubConfigurationServiceConfiguration';
import { makeUrlAbsolute } from '../../helpers/makeUrlAbsolute';

export class HubConfigurationService {
    private _configuration: IHubConfigurationServiceConfiguration;
    private _web: Web;

    /**
     * Configure HubConfigurationService
     * 
     * @param {IHubConfigurationServiceConfiguration} configuration Configuration for HubConfigurationService
     */
    public configure(configuration: IHubConfigurationServiceConfiguration): HubConfigurationService {
        this._configuration = { ...HubConfigurationServiceDefaultConfiguration, ...configuration };
        if (typeof this._configuration.urlOrWeb === 'string') {
            this._web = new Web(this._configuration.urlOrWeb);
        } else {
            this._web = this._configuration.urlOrWeb;
        }
        return this;
    }

    /**
     * Get project columns
     */
    public async getProjectColumns(): Promise<ProjectColumn[]> {
        let spItems = await this._web.lists.getByTitle(this._configuration.listNames.PROJECT_COLUMNS)
            .items
            .select(...Object.keys(new SPProjectColumnItem()))
            .get<SPProjectColumnItem[]>();
        return spItems.map(item => new ProjectColumn(item));
    }

    /**
     * Get project status sections
     */
    public async getProjectStatusSections(): Promise<SectionModel[]> {
        let items = await this._web.lists.getByTitle(this._configuration.listNames.STATUS_SECTIONS).items.get();
        return items.map(item => new SectionModel(item));
    }

    public async updateStatusReport(id: number, properties: TypedHash<string>): Promise<void> {
        await this._web.lists.getByTitle(this._configuration.listNames.STATUS_SECTIONS).items.getById(id).update(properties);
    }

    /**
     * Get project column configuration
     */
    public async getProjectColumnConfig(): Promise<ProjectColumnConfig[]> {
        let spItems = await this._web.lists.getByTitle(this._configuration.listNames.PROJECT_COLUMN_CONFIGURATION).items
            .orderBy('ID', true)
            .expand('GtPortfolioColumn')
            .select(...Object.keys(new SPProjectColumnConfigItem()), 'GtPortfolioColumn/Title', 'GtPortfolioColumn/GtInternalName')
            .get<SPProjectColumnConfigItem[]>();
        return spItems.map(item => new ProjectColumnConfig(item));;
    }

    /**
     * Get portfolio overview views
     */
    public async getPortfolioOverviewViews(): Promise<PortfolioOverviewView[]> {
        let spItems = await this._web.lists.getByTitle(this._configuration.listNames.PORTFOLIO_VIEWS).items
            .orderBy('GtSortOrder', true)
            .get<SPPortfolioOverviewViewItem[]>();
        return spItems.map(item => new PortfolioOverviewView(item));;
    }

    /**
     * Get list form urls
     * 
     * @param {HubConfigurationServiceList} list List key
     */
    public async getListFormUrls(list: HubConfigurationServiceList): Promise<{ defaultNewFormUrl: string, defaultEditFormUrl: string }> {
        let urls = await this._web.lists.getByTitle(this._configuration.listNames[list])
            .select('DefaultNewFormUrl', 'DefaultEditFormUrl')
            .expand('DefaultNewFormUrl', 'DefaultEditFormUrl')
            .get<{ DefaultNewFormUrl: string, DefaultEditFormUrl: string }>();
        return { defaultNewFormUrl: makeUrlAbsolute(urls.DefaultNewFormUrl), defaultEditFormUrl: makeUrlAbsolute(urls.DefaultEditFormUrl) };
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
        const targetWeb = new Web(url);
        const { jsomContext } = await initSpfxJsom(url, { loadTaxonomy: true });
        const [sourceContentType, targetSiteFields, ensureList] = await Promise.all([
            this._getHubContentType(contentTypeId),
            this._getSiteFields(targetWeb),
            targetWeb.lists.ensure(listName, '', 100, false, { Hidden: true, EnableAttachments: false }),
        ]);
        const listFields = await this.getListFields(listName, undefined, targetWeb);
        const spList = jsomContext.web.get_lists().getByTitle(listName);
        for (let field of sourceContentType.Fields) {
            let [[listField], [siteField]] = [listFields.filter(fld => fld.InternalName === field.InternalName), targetSiteFields.filter(fld => fld.InternalName === field.InternalName)];
            if (listField) continue;
            try {
                if (siteField) {
                    let spSiteField = jsomContext.web.get_fields().getByInternalNameOrTitle(siteField.InternalName);
                    spList.get_fields().add(spSiteField);
                } else {
                    let newField = spList.get_fields().addFieldAsXml(transformFieldXml(field.SchemaXml, { DisplayName: field.InternalName }), false, SP.AddFieldOptions.addToDefaultContentType);
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
     * @param {string} contentTypeId Content type ID
     */
    private async _getHubContentType(contentTypeId: string): Promise<ISPContentType> {
        let contentType = await this._web.contentTypes
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
     * Get hub files
     * 
     * @param {string} listName List name 
     * @param {T} constructor Constructor
     */
    public async getHubFiles<T>(listName: string, constructor: new (file: any, web: Web) => T): Promise<T[]> {
        const files = await this._web.lists.getByTitle(listName).rootFolder.files.usingCaching().get();
        return files.map(file => new constructor(file, this._web));
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
            let list = this._web.lists.getByTitle(listName);
            let items: any[];
            if (query) {
                items = await list.usingCaching().getItemsByCAMLQuery(query, ...expands);
            } else {
                items = await list.usingCaching().items.usingCaching().get();
            }
            return items.map(item => new constructor(item, this._web));
        } catch (error) {
            throw error;
        }
    }


    /**
     * Add status report
     * 
     * @param {TypedHash} properties Properties
     */
    public async addStatusReport(properties: TypedHash<string>): Promise<number> {
        let itemAddResult = await this._web.lists.getByTitle(this._configuration.listNames.PROJECT_STATUS).items.add(properties);
        return itemAddResult.data.Id;
    }

    /**
     * Get status reports
     * 
     * @param {string} filter Filter
     * @param {number} top Number of reports to retrieve
     * @param {string{}} select Fields to retrieve
     * @param {string[]} expand Expand
     */
    public async getStatusReports(filter: string = '', top?: number, select?: string[], expand: string[] = ['FieldValuesAsText']): Promise<StatusReport[]> {
        if (!this._configuration.siteId) throw 'Property {siteId} missing in configuration';
        if (stringIsNullOrEmpty(filter)) filter = `GtSiteId eq '${this._configuration.siteId}'`;
        try {
            let items = this._web.lists.getByTitle(this._configuration.listNames.PROJECT_STATUS)
                .items
                .filter(filter)
                .expand(...expand)
                .orderBy('Id', false);
            if (top) items = items.top(top);
            if (select) items = items.select(...select);
            return (await items.get()).map(i => new StatusReport(i));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get status report list props
     */
    public async getStatusReportListProps(): Promise<{ DefaultEditFormUrl: string }> {
        try {
            return this._web.lists.getByTitle(this._configuration.listNames.PROJECT_STATUS)
                .select('DefaultEditFormUrl')
                .expand('DefaultEditFormUrl')
                .usingCaching({
                    key: 'projectstatus_defaulteditformurl',
                    storeName: 'session',
                    expiration: dateAdd(new Date(), 'day', 1),
                })
                .get<{ DefaultEditFormUrl: string }>();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get list fields
     * 
     * @param {HubConfigurationServiceList | string} list List
     * @param {string} filter Filter 
     * @param {Web} web Web 
     */
    public async getListFields(list: HubConfigurationServiceList | string, filter?: string, web: Web = this._web): Promise<SPField[]> {
        let fields = web.lists.getByTitle(this._configuration.listNames[list] || list)
            .fields
            .select(...Object.keys(new SPField()));
        if (filter) {
            fields = fields.filter(filter);
        }
        return fields.get<SPField[]>();
    }
}