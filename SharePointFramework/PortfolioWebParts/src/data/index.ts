import { sp, SearchResults } from '@pnp/sp';
import { makeUrlAbsolute } from '@Shared/helpers';
import * as cleanDeep from 'clean-deep';
import { IPortfolioOverviewColumnSpItem, IPortfolioOverviewConfiguration, IPortfolioOverviewViewSpItem, IProjectColumnConfigSpItem } from 'interfaces';
import { ChartConfiguration, ChartData, ChartDataItem, DataField, DataFieldType, PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import { ProjectColumnConfig, ProjectColumnConfigDictionary } from 'models/ProjectColumnConfig';
import * as objectGet from 'object-get';
import * as strings from 'PortfolioWebPartsStrings';
import { DEFAULT_SEARCH_SETTINGS } from './DEFAULT_SEARCH_SETTINGS';

export class SPChartConfigurationItem {
    public ContentTypeId: string = '';
    public Title: string = '';
    public GtPiSubTitle: string = '';
    public GtPiFieldsId: number[] = [];
    public GtPiCategoryFieldId: number = 0;
    public GtPiWidthSm: number = 0;
    public GtPiWidthMd: number = 0;
    public GtPiWidthLg: number = 0;
    public GtPiWidthXl: number = 0;
    public GtPiWidthXxl: number = 0;
    public GtPiWidthXxxl: number = 0;
}

export class SPColumnConfigurationItem {
    public Id: number = 0;
    public Title: string = '';
    public GtManagedProperty: string = '';
    public GtFieldDataType: string = '';
}

export class SPContentType {
    public StringId: string = '';
    public Name: string = '';
    public NewFormUrl: string = '';
}

/**
 * Fetch chart data
 *
 * @param {PortfolioOverviewView} view View configuration
 * @param {IPortfolioOverviewConfiguration} configuration PortfolioOverviewConfiguration
 * @param {string} siteId Site ID
 */
export async function fetchChartData(view: PortfolioOverviewView, configuration: IPortfolioOverviewConfiguration, siteId: string) {
    try {
        const [chartItems, columnConfigItems, contentTypes] = await Promise.all([
            sp.web.lists.getByTitle(strings.SPChartConfigurationList).items
                .select(...Object.keys(new SPChartConfigurationItem()))
                .get<SPChartConfigurationItem[]>(),
            sp.web.lists.getByTitle(strings.SPColumnConfigurationList).items
                .select(...Object.keys(new SPColumnConfigurationItem()))
                .get<SPColumnConfigurationItem[]>(),
            sp.web.lists.getByTitle(strings.SPChartConfigurationList).contentTypes
                .select(...Object.keys(new SPContentType()))
                .get<SPContentType[]>(),
        ]);
        let charts: ChartConfiguration[] = chartItems.map(item => {
            let fields = item.GtPiFieldsId.map(id => {
                const [fld] = columnConfigItems.filter(_fld => _fld.Id === id);
                return new DataField(fld.Title, fld.GtManagedProperty, fld.GtFieldDataType as DataFieldType);
            });
            let chart = new ChartConfiguration(item, fields);
            return chart;
        });
        let items = (await fetchDataForView(view, configuration, siteId)).items.map(i => new ChartDataItem(i.Title, i));
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


export interface IFetchDataForViewResult {
    items: any[];
    refiners: any[];
}

/**
 * Fetch data for view
 *
 * @param {PortfolioOverviewView} view View configuration
 * @param {IPortfolioOverviewConfiguration} configuration PortfolioOverviewConfiguration
 * @param {string} siteId Site ID
 * @param {string} siteIdProperty Site ID property
 */
export async function fetchDataForView(view: PortfolioOverviewView, configuration: IPortfolioOverviewConfiguration, siteId: string, siteIdProperty: string = 'GtSiteIdOWSTEXT'): Promise<IFetchDataForViewResult> {
    try {
        let searchResults: SearchResults[] = await Promise.all([
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

        let refiners = objectGet(searchResults[0], 'RawSearchResults.PrimaryQueryResult.RefinementResults.Refiners') || [];
        let projects = searchResults[0].PrimarySearchResults.map(item => cleanDeep({ ...item }));
        let sites = searchResults[1].PrimarySearchResults.map(item => cleanDeep({ ...item }));
        let statusReports = searchResults[2].PrimarySearchResults.map(item => cleanDeep({ ...item }));
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
 */
export async function getPortfolioConfig(): Promise<IPortfolioOverviewConfiguration> {
    try {
        const spItems = await Promise.all([
            sp.web.lists.getByTitle(strings.ProjectColumnConfigListName).items
                .orderBy('ID', true)
                .get<IProjectColumnConfigSpItem[]>(),
            sp.web.lists.getByTitle(strings.ProjectColumnsListName).items
                .orderBy('GtSortOrder', true)
                .get<IPortfolioOverviewColumnSpItem[]>(),
            sp.web.lists.getByTitle(strings.PortfolioViewsListName).items
                .orderBy('GtSortOrder', true)
                .get<IPortfolioOverviewViewSpItem[]>(),
            sp.web.lists.getByTitle(strings.PortfolioViewsListName)
                .select('DefaultNewFormUrl')
                .expand('DefaultNewFormUrl')
                .get<{ DefaultNewFormUrl: string }>(),
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
        };
        return config;
    } catch (error) {
        throw error;
    }
}