import { WebPartContext } from '@microsoft/sp-webpart-base';
import { dateAdd } from '@pnp/common';
import { QueryPropertyValueType, SearchResults, SortDirection, sp } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import * as cleanDeep from 'clean-deep';
import { IGraphGroup, IPortfolioOverviewConfiguration, ISPProjectItem, ISPUser } from 'interfaces';
import { ChartConfiguration, ChartData, ChartDataItem, DataField, PortfolioOverviewColumn, PortfolioOverviewView, ProjectListModel, SPChartConfigurationItem, SPContentType, SPPortfolioOverviewColumnItem, SPPortfolioOverviewViewItem, SPProjectColumnConfigItem } from 'models';
import { ProjectColumnConfig, ProjectColumnConfigDictionary } from 'models/ProjectColumnConfig';
import MSGraph from 'msgraph-helper';
import * as objectGet from 'object-get';
import { getObjectValue, makeUrlAbsolute } from 'shared/lib/helpers';
import { DEFAULT_SEARCH_SETTINGS } from './DEFAULT_SEARCH_SETTINGS';
import { IFetchDataForViewResult, IFetchDataForViewRefinersResult, FetchDataForViewRefinerEntryResult } from './IFetchDataForViewResult';


export class DataAdapter {
    constructor(public context: WebPartContext) { }

    /**
     * Fetch chart data (used by [PortfolioInsights])
     *
     * @param {PortfolioOverviewView} view View configuration
     * @param {IPortfolioOverviewConfiguration} configuration PortfolioOverviewConfiguration
     * @param {string} chartConfigurationListName List name for chart configuration
     * @param {string} siteId Site ID
     */
    public async fetchChartData(view: PortfolioOverviewView, configuration: IPortfolioOverviewConfiguration, chartConfigurationListName: string, siteId: string) {
        try {
            const [chartItems, contentTypes] = await Promise.all([
                sp.web.lists.getByTitle(chartConfigurationListName).items
                    .select(...Object.keys(new SPChartConfigurationItem()))
                    .get<SPChartConfigurationItem[]>(),
                sp.web.lists.getByTitle(chartConfigurationListName).contentTypes
                    .select(...Object.keys(new SPContentType()))
                    .get<SPContentType[]>(),
            ]);
            let charts: ChartConfiguration[] = chartItems.map(item => {
                let fields = item.GtPiFieldsId.map(id => {
                    const [fld] = configuration.columns.filter(_fld => _fld.id === id);
                    return new DataField(fld.name, fld.fieldName, fld.dataType);
                });
                let chart = new ChartConfiguration(item, fields);
                return chart;
            });
            let items = (await this.fetchDataForView(view, configuration, siteId)).items.map(i => new ChartDataItem(i.Title, i));
            let chartData = new ChartData(items);

            return {
                charts,
                chartData,
                contentTypes,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Fetch data for view (used by [PortfolioOverview] and [PortfolioInsights])
     *
     * @param {PortfolioOverviewView} view View configuration
     * @param {IPortfolioOverviewConfiguration} configuration PortfolioOverviewConfiguration
     * @param {string} siteId Site ID
     * @param {string} siteIdProperty Site ID property
     */
    public async fetchDataForView(view: PortfolioOverviewView, configuration: IPortfolioOverviewConfiguration, siteId: string, siteIdProperty: string = 'GtSiteIdOWSTEXT'): Promise<IFetchDataForViewResult> {
        try {
            let response: SearchResults[] = await Promise.all([
                sp.search({
                    ...DEFAULT_SEARCH_SETTINGS,
                    QueryTemplate: view.searchQuery,
                    SelectProperties: [...configuration.columns.map(f => f.fieldName), siteIdProperty],
                    Refiners: configuration.refiners.map(ref => ref.fieldName).join(','),
                }),
                sp.search({
                    ...DEFAULT_SEARCH_SETTINGS,
                    QueryTemplate: `DepartmentId:{${siteId}} contentclass:STS_Site`,
                    SelectProperties: ['Path', 'Title', 'SiteId'],
                }),
                sp.search({
                    ...DEFAULT_SEARCH_SETTINGS,
                    QueryTemplate: `DepartmentId:{${siteId}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5*`,
                    SelectProperties: [...configuration.columns.map(f => f.fieldName), siteIdProperty],
                    Refiners: configuration.refiners.map(ref => ref.fieldName).join(','),
                }),
            ]);

            let refiners: IFetchDataForViewRefinersResult = (objectGet(response[0], 'RawSearchResults.PrimaryQueryResult.RefinementResults.Refiners') || []).reduce((obj: IFetchDataForViewRefinersResult, ref: { Name: string, Entries: any[] }) => {
                obj[ref.Name] = ref.Entries.map(e => new FetchDataForViewRefinerEntryResult(e.RefinementName, e.RefinementValue));
                return obj;
            }, {});
            let projects = response[0].PrimarySearchResults.map(item => cleanDeep({ ...item }));
            let sites = response[1].PrimarySearchResults.map(item => cleanDeep({ ...item }));
            let statusReports = response[2].PrimarySearchResults.map(item => cleanDeep({ ...item }));
            let validSites = sites.filter(site => projects.filter(res => res[siteIdProperty] === site['SiteId']).length === 1);
            let items = validSites.map(site => {
                const [project] = projects.filter(res => res[siteIdProperty] === site['SiteId']);
                const [statusReport] = statusReports.filter(res => res[siteIdProperty] === site['SiteId']);
                return { ...statusReport, ...project, Title: site.Title, Path: site.Path, SiteId: site['SiteId'] };
            });
            return { items, refiners };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Get config from lists
     * 
     * @param {string} columnConfigListName List name for project column config
     * @param {string} columnsListName List name for project columns
     * @param {string} viewsListName List name for portfolio views
     */
    public async getPortfolioConfig(columnConfigListName: string, columnsListName: string, viewsListName: string): Promise<IPortfolioOverviewConfiguration> {
        try {
            const spItems = await Promise.all([
                sp.web.lists.getByTitle(columnConfigListName).items
                    .orderBy('ID', true)
                    .select(...Object.keys(new SPProjectColumnConfigItem()))
                    .get<SPProjectColumnConfigItem[]>(),
                sp.web.lists.getByTitle(columnsListName).items
                    .orderBy('GtSortOrder', true)
                    .select(...Object.keys(new SPPortfolioOverviewColumnItem()))
                    .get<SPPortfolioOverviewColumnItem[]>(),
                sp.web.lists.getByTitle(viewsListName).items
                    .orderBy('GtSortOrder', true)
                    .get<SPPortfolioOverviewViewItem[]>(),
                sp.web.lists.getByTitle(viewsListName)
                    .select('DefaultNewFormUrl', 'DefaultEditFormUrl')
                    .expand('DefaultNewFormUrl', 'DefaultEditFormUrl')
                    .usingCaching({
                        key: 'getportfolioconfig_forms',
                        storeName: 'session',
                        expiration: dateAdd(new Date(), 'minute', 15),
                    })
                    .get<{ DefaultNewFormUrl: string, DefaultEditFormUrl: string }>(),
                sp.web.lists.getByTitle(columnsListName)
                    .select('DefaultNewFormUrl', 'DefaultEditFormUrl')
                    .expand('DefaultNewFormUrl', 'DefaultEditFormUrl')
                    .usingCaching({
                        key: 'getportfolioconfig_columns_forms',
                        storeName: 'session',
                        expiration: dateAdd(new Date(), 'minute', 15),
                    })
                    .get<{ DefaultNewFormUrl: string, DefaultEditFormUrl: string }>(),
                sp.web.lists.getByTitle(columnsListName)
                    .fields
                    .filter(`substringof('GtShowField', InternalName)`)
                    .select('InternalName', 'Title')
                    .usingCaching({
                        key: 'getportfolioconfig_showfields',
                        storeName: 'session',
                        expiration: dateAdd(new Date(), 'minute', 15),
                    })
                    .get<{ InternalName: string, Title: string }[]>(),
            ]);
            const columnConfig = spItems[0].map(c => new ProjectColumnConfig(c));
            const columns = spItems[1].map(c => {
                let column = new PortfolioOverviewColumn(c);
                column.config = columnConfig
                    .filter(_c => _c.columnId === c.Id)
                    .reduce((obj, { value, color, iconName }) => ({ ...obj, [value]: { color, iconName } }), {}) as ProjectColumnConfigDictionary;
                return column;
            });
            const views = spItems[2].map(c => new PortfolioOverviewView(c, columns));
            const refiners = columns.filter(col => col.isRefinable);
            const config: IPortfolioOverviewConfiguration = {
                columns,
                refiners,
                views,
                viewNewFormUrl: makeUrlAbsolute(spItems[3].DefaultNewFormUrl),
                viewEditFormUrl: makeUrlAbsolute(spItems[3].DefaultEditFormUrl),
                colNewFormUrl: makeUrlAbsolute(spItems[4].DefaultNewFormUrl),
                colEditFormUrl: makeUrlAbsolute(spItems[4].DefaultEditFormUrl),
                showFields: spItems[5],
            };
            return config;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Fetch project sites
     * 
     * @param {number} rowLimit Row limit
     * @param {string} sortProperty Sort property
     * @param {SortDirection} sortDirection Sort direction
     */
    public async fetchProjectSites(rowLimit: number, sortProperty: string, sortDirection: SortDirection) {
        let { PrimarySearchResults } = await sp.search({
            Querytext: `DepartmentId:{${this.context.pageContext.legacyPageContext.hubSiteId}} contentclass:STS_Site`,
            TrimDuplicates: false,
            RowLimit: rowLimit,
            SelectProperties: ['Title', 'Path', 'SiteId', 'Created'],
            SortList: [{
                Property: sortProperty,
                Direction: sortDirection,
            }],
            Properties: [{
                Name: 'EnableDynamicGroups',
                Value: {
                    BoolVal: true,
                    QueryPropertyValueTypeIndex: QueryPropertyValueType.BooleanType
                }
            }]
        });
        return PrimarySearchResults.filter(site => this.context.pageContext.legacyPageContext.hubSiteId !== site['SiteId']);
    }

    /**
       * Map projects
       * 
       * @param {ISPProjectItem[]} items Items
       * @param {IGraphGroup[]} groups Groups
       * @param {Object} photos Photos
       * @param {ISPUser[]} users Users
       * @param {any[]} phaseTerms Phase terms
       */
    private mapProjects(items: ISPProjectItem[], groups: IGraphGroup[], users: ISPUser[], phaseTerms: any[]): ProjectListModel[] {
        let projects = items
            .map(item => {
                let [group] = groups.filter(grp => grp.id === item.GtGroupId);
                if (!group) {
                    return null;
                }
                let [owner] = users.filter(user => user.Id === item.GtProjectOwnerId);
                let [manager] = users.filter(user => user.Id === item.GtProjectManagerId);
                let [phase] = phaseTerms.filter(p => p.Id.indexOf(getObjectValue<string>(item, 'GtProjectPhase.TermGuid', '')) !== -1);
                const model = new ProjectListModel(item.GtSiteId, group.id, group.displayName, item.GtSiteUrl, manager, owner, phase);
                return model;
            })
            .filter(p => p);
        return projects;
    }

    /**
     * Fetch enriched projects
     * 
     * @param {string} listName List name for projects
     * @param {string} phaseTermSetId Phase term set id
     */
    public async fetchEncrichedProjects(listName: string, phaseTermSetId: string): Promise<ProjectListModel[]> {
        await MSGraph.Init(this.context.msGraphClientFactory);
        let [items, groups, users, phaseTerms] = await Promise.all([
            sp.web
                .lists
                .getByTitle(listName)
                .items
                .select('GtGroupId', 'GtSiteId', 'GtSiteUrl', 'GtProjectOwnerId', 'GtProjectManagerId', 'GtProjectPhase')
                .orderBy('Title')
                .usingCaching()
                .get<ISPProjectItem[]>(),
            MSGraph.Get<IGraphGroup[]>(`/me/memberOf/$/microsoft.graph.group`, ['id', 'displayName'], `groupTypes/any(a:a%20eq%20'unified')`),
            sp.web
                .siteUsers
                .select('Id', 'Title', 'Email')
                .usingCaching({
                    key: 'fetchencrichedprojects_siteusers',
                    storeName: 'session',
                    expiration: dateAdd(new Date(), 'minute', 15),
                })
                .get<ISPUser[]>(),
            taxonomy
                .getDefaultSiteCollectionTermStore()
                .getTermSetById(phaseTermSetId)
                .terms
                .usingCaching({
                    key: 'fetchencrichedprojects_terms',
                    storeName: 'session',
                    expiration: dateAdd(new Date(), 'minute', 15),
                })
                .get(),
        ]);
        let projects = this.mapProjects(items, groups, users, phaseTerms);
        return projects;
    }
}

export { IFetchDataForViewRefinersResult };