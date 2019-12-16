import { WebPartContext } from '@microsoft/sp-webpart-base';
import { dateAdd } from '@pnp/common';
import { QueryPropertyValueType, SearchResult, SearchResults, SortDirection, sp } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import * as cleanDeep from 'clean-deep';
import { IGraphGroup, IPortfolioConfiguration, ISPProjectItem, ISPUser } from 'interfaces';
import { ChartConfiguration, ChartData, ChartDataItem, DataField, ProjectListModel, SPChartConfigurationItem, SPContentType } from 'models';
import MSGraph from 'msgraph-helper';
import * as objectGet from 'object-get';
import { getObjectValue } from 'shared/lib/helpers';
import * as _ from 'underscore';
import { DEFAULT_SEARCH_SETTINGS } from './DEFAULT_SEARCH_SETTINGS';
import { FetchDataForViewRefinerEntryResult, IFetchDataForViewRefinersResult, IFetchDataForViewResult } from './IFetchDataForViewResult';
import { PortfolioOverviewView } from 'shared/lib/models';
import { PortalDataService } from 'shared/lib/services/PortalDataService';


export class DataAdapter {
    private _portalDataService: PortalDataService;

    constructor(public context: WebPartContext) {
        this._portalDataService = new PortalDataService().configure({ urlOrWeb: context.pageContext.web.absoluteUrl });
    }

    /**
     * Fetch chart data (used by [PortfolioInsights])
     *
     * @param {PortfolioOverviewView} view View configuration
     * @param {IPortfolioConfiguration} configuration PortfolioOverviewConfiguration
     * @param {string} chartConfigurationListName List name for chart configuration
     * @param {string} siteId Site ID
     */
    public async fetchChartData(view: PortfolioOverviewView, configuration: IPortfolioConfiguration, chartConfigurationListName: string, siteId: string) {
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
                    const fld = _.find(configuration.columns, f => f.id === id);
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

    public async getPortfolioConfig(): Promise<IPortfolioConfiguration> {
        let [columnConfig, columns, views, viewsUrls, columnUrls] = await Promise.all([
            this._portalDataService.getProjectColumnConfig(),
            this._portalDataService.getProjectColumns(),
            this._portalDataService.getPortfolioOverviewViews(),
            this._portalDataService.getListFormUrls('PORTFOLIO_VIEWS'),
            this._portalDataService.getListFormUrls('PROJECT_COLUMNS'),
        ]);
        columns = columns.map(col => col.configure(columnConfig));
        let refiners = columns.filter(col => col.isRefinable);
        views = views.map(view => view.configure(columns));
        return {
            columns,
            refiners,
            views,
            viewsUrls,
            columnUrls,
        };
    }

    /**
     * Fetch data for view
     *
     * @description Used by PortfolioOverview and PortfolioInsights
     * 
     * @param {PortfolioOverviewView} view View configuration
     * @param {IPortfolioConfiguration} configuration PortfolioOverviewConfiguration
     * @param {string} siteId Site ID
     * @param {string} siteIdProperty Site ID property
     */
    public async fetchDataForView(view: PortfolioOverviewView, configuration: IPortfolioConfiguration, siteId: string, siteIdProperty: string = 'GtSiteIdOWSTEXT'): Promise<IFetchDataForViewResult> {
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
                    QueryTemplate: `DepartmentId:{${siteId}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:Publisert`,
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
     * Fetch project sites
     * 
     * @param {number} rowLimit Row limit
     * @param {string} sortProperty Sort property
     * @param {SortDirection} sortDirection Sort direction
     */
    public async fetchProjectSites(rowLimit: number, sortProperty: string, sortDirection: SortDirection): Promise<SearchResult[]> {
        let response = await sp.search({
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
        return response.PrimarySearchResults.filter(site => this.context.pageContext.legacyPageContext.hubSiteId !== site['SiteId']);
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
    private _mapProjects(items: ISPProjectItem[], groups: IGraphGroup[], users: ISPUser[], phaseTerms: any[]): ProjectListModel[] {
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
        let projects = this._mapProjects(items, groups, users, phaseTerms);
        return projects;
    }
}

export { IFetchDataForViewRefinersResult };

