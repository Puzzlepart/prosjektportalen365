import { sp } from '@pnp/sp';
import { makeUrlAbsolute } from '@Shared/helpers';
import * as cleanDeep from 'clean-deep';
import { IPortfolioOverviewColumnSpItem, IPortfolioOverviewConfiguration, IPortfolioOverviewViewSpItem, IProjectColumnConfigSpItem, ISPChartConfiguration, ISPColumnConfiguration } from 'interfaces';
import { ChartConfiguration, ChartData, ChartDataItem, DataField, DataFieldType, PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import { ProjectColumnConfig, ProjectColumnConfigDictionary } from 'models/ProjectColumnConfig';
import * as objectGet from 'object-get';
import * as strings from 'PortfolioWebPartsStrings';
import { DEFAULT_SEARCH_SETTINGS } from './DEFAULT_SEARCH_SETTINGS';

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
                .select(
                    'ContentTypeId',
                    'Title',
                    'GtPiSubTitle',
                    'GtPiFieldsId',
                    'GtPiCategoryFieldId',
                    'GtPiWidthSm',
                    'GtPiWidthMd',
                    'GtPiWidthLg',
                    'GtPiWidthXl',
                    'GtPiWidthXxl',
                    'GtPiWidthXxxl',
                )
                .get<ISPChartConfiguration[]>(),
            sp.web.lists.getByTitle(strings.SPColumnConfigurationList).items
                .select(
                    'Id',
                    'Title',
                    'GtManagedProperty',
                    'GtFieldDataType',
                )
                .get<ISPColumnConfiguration[]>(),
            sp.web.lists.getByTitle(strings.SPChartConfigurationList).contentTypes
                .select(
                    'StringId',
                    'Name',
                    'NewFormUrl',
                )
                .get<{ StringId: string, Name: string, NewFormUrl: string }[]>(),
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
        let [{ PrimarySearchResults: projects }, { PrimarySearchResults: sites }, { PrimarySearchResults: statusReports }] = await Promise.all([
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

        let refiners = objectGet(projects, 'RawSearchResults.PrimaryQueryResult.RefinementResults.Refiners') || [];
        projects = projects.map(item => cleanDeep({ ...item }));
        sites = sites.map(item => cleanDeep({ ...item }));
        statusReports = statusReports.map(item => cleanDeep({ ...item }));
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