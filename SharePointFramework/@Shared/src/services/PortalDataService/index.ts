import { dateAdd, stringIsNullOrEmpty, TypedHash } from '@pnp/common';
import { CamlQuery, Web, ListEnsureResult } from '@pnp/sp';
import { default as initSpfxJsom, ExecuteJsomQuery } from 'spfx-jsom';
import { makeUrlAbsolute } from '../../helpers/makeUrlAbsolute';
import { transformFieldXml } from '../../helpers/transformFieldXml';
import { ISPContentType } from '../../interfaces';
import { PortfolioOverviewView, ProjectColumn, ProjectColumnConfig, SectionModel, SPField, SPPortfolioOverviewViewItem, SPProjectColumnConfigItem, SPProjectColumnItem, StatusReport } from '../../models';
import { IPortalDataServiceConfiguration, PortalDataServiceDefaultConfiguration, PortalDataServiceList } from './IPortalDataServiceConfiguration';

export class PortalDataService {
    private _configuration: IPortalDataServiceConfiguration;
    private _web: Web;

    /**
     * Configure PortalDataService
     * 
     * @param {IPortalDataServiceConfiguration} configuration Configuration for PortalDataService
     */
    public configure(configuration: IPortalDataServiceConfiguration): PortalDataService {
        this._configuration = { ...PortalDataServiceDefaultConfiguration, ...configuration };
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
        try {
            let spItems = await this._web.lists.getByTitle(this._configuration.listNames.PROJECT_COLUMNS)
                .items
                .select(...Object.keys(new SPProjectColumnItem()))
                .get<SPProjectColumnItem[]>();
            return spItems.map(item => new ProjectColumn(item));
        } catch (error) {
            return [];
        }
    }

    /**
     * Get project status sections
     */
    public async getProjectStatusSections(): Promise<SectionModel[]> {
        try {
            let items = await this._web.lists.getByTitle(this._configuration.listNames.STATUS_SECTIONS).items.get();
            return items.map(item => new SectionModel(item));
        } catch (error) {
            return [];
        }
    }

    /**
     * Update status report
     * 
     * @param {number} id Id
     * @param {TypedHash<string>} properties Properties
     */
    public async updateStatusReport(id: number, properties: TypedHash<string>): Promise<void> {
        await this._web.lists.getByTitle(this._configuration.listNames.PROJECT_STATUS).items.getById(id).update(properties);
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
        return spItems.map(item => new ProjectColumnConfig(item));
    }

    /**
     * Get portfolio overview views
     */
    public async getPortfolioOverviewViews(): Promise<PortfolioOverviewView[]> {
        let spItems = await this._web.lists.getByTitle(this._configuration.listNames.PORTFOLIO_VIEWS).items
            .orderBy('GtSortOrder', true)
            .get<SPPortfolioOverviewViewItem[]>();
        return spItems.map(item => new PortfolioOverviewView(item));
    }

    /**
     * Get list form urls
     * 
     * @param {PortalDataServiceList} list List key
     */
    public async getListFormUrls(list: PortalDataServiceList): Promise<{ defaultNewFormUrl: string, defaultEditFormUrl: string }> {
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
    public async syncList(url: string, listName: string, contentTypeId: string, properties?: TypedHash<string>): Promise<ListEnsureResult> {
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
            let [[listField], [siteField]] = [
                listFields.filter(fld => fld.InternalName === field.InternalName),
                targetSiteFields.filter(fld => fld.InternalName === field.InternalName && fld.SchemaXml.indexOf('ShowInEditForm="FALSE"') === -1),
            ];
            if (listField) continue;
            try {
                let [fieldLink] = sourceContentType.FieldLinks.filter(fl => fl.Name === field.InternalName);
                if (siteField) {
                    let spSiteField = jsomContext.web.get_fields().getByInternalNameOrTitle(siteField.InternalName);
                    let newField = spList.get_fields().add(spSiteField);
                    if (fieldLink && fieldLink.Required) {
                        newField.set_required(true);
                        newField.updateAndPushChanges(true);
                    }
                } else {
                    let newField = spList.get_fields().addFieldAsXml(transformFieldXml(field.SchemaXml, { DisplayName: field.InternalName }), false, SP.AddFieldOptions.addToDefaultContentType);
                    if (fieldLink && fieldLink.Required) {
                        newField.set_required(true);
                    }
                    newField.set_title(field.Title);
                    newField.updateAndPushChanges(true);
                }
                await ExecuteJsomQuery(jsomContext);
            } catch (error) { }
        }
        try {
            let newField = spList.get_fields().addFieldAsXml(`<Field Type="Note" DisplayName="TemplateParameters" ID="{b8854944-7141-471f-b8df-53d93a4395ba}" StaticName="TemplateParameters" Name="TemplateParameters" UnlimitedLengthInDocumentLibrary="TRUE" ShowInEditForm="FALSE" />`, false, SP.AddFieldOptions.addToDefaultContentType);
            newField.updateAndPushChanges(true);
            await ExecuteJsomQuery(jsomContext);
        } catch { }
        if (ensureList.created && properties) {
            ensureList.list.items.add(properties);
        }
        return ensureList;
    }

    /**
     * Get hub content type
     * 
     * @param {string} contentTypeId Content type ID
     */
    private async _getHubContentType(contentTypeId: string): Promise<ISPContentType> {
        let contentType = await this._web.contentTypes
            .getById(contentTypeId)
            .select('StringId', 'Name', 'Fields/InternalName', 'Fields/Title', 'Fields/SchemaXml', 'Fields/InternalName', 'FieldLinks/Name', 'FieldLinks/Required')
            .expand('Fields', 'FieldLinks')
            .get<ISPContentType>();
        return contentType;
    }

    /**
     * Get site fields
     * 
     * @param {Web} web Web
     */
    private async _getSiteFields(web: Web): Promise<SPField[]> {
        let siteFields = await web.fields.select(...Object.keys(new SPField())).get<SPField[]>();
        return siteFields;
    }

    /**
     * Get files
     * 
     * @param {string} listName List name 
     * @param {T} constructor Constructor
     */
    public async getFiles<T>(listName: string, constructor: new (file: any, web: Web) => T): Promise<T[]> {
        const files = await this._web.lists.getByTitle(listName).rootFolder.files.usingCaching().get();
        return files.map(file => new constructor(file, this._web));
    }

    /**
     * Get items
     * 
     * @param {string} listName List name 
     * @param {T} constructor Constructor
     * @param {CamlQuery} query Query
     * @param {string[]} expands Expands
     */
    public async getItems<T>(listName: string, constructor: new (item: any, web: Web) => T, query?: CamlQuery, expands?: string[]): Promise<T[]> {
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
     * @param {PortalDataServiceList | string} list List
     * @param {string} filter Filter 
     * @param {Web} web Web 
     */
    public async getListFields(list: PortalDataServiceList | string, filter?: string, web: Web = this._web): Promise<SPField[]> {
        let fields = web.lists.getByTitle(this._configuration.listNames[list] || list)
            .fields
            .select(...Object.keys(new SPField()));
        if (filter) {
            fields = fields.filter(filter);
        }
        return fields.get<SPField[]>();
    }
}