import * as strings from 'PortfolioInsightsWebPartStrings';
import { sp, QueryPropertyValueType, SearchQuery } from '@pnp/sp';
import { ChartConfiguration } from '../models/ChartConfiguration';
import { ISPChartConfiguration } from '../interfaces/ISPChartConfiguration';
import { DataField, DataFieldType } from '../models/DataField';
import { ChartData } from '../models/ChartData';
import { ChartDataItem } from '../models/ChartDataItem';
import { ISPColumnConfiguration } from '../interfaces/ISPColumnConfiguration';
import { ISPSearchSite } from '../interfaces/ISPSearchSite';
import { WebPartContext } from '@microsoft/sp-webpart-base';

const SPChartConfigurationListSelect = [
    'ContentTypeId',
    'Title',
    'GtPiSubTitle',
    'GtPiDataSourceLookup/Id',
    'GtPiDataSourceLookup/GtSearchQuery',
    'GtPiFieldsId',
    'GtPiCategoryFieldId',
    'GtPiWidthSm',
    'GtPiWidthMd',
    'GtPiWidthLg',
    'GtPiWidthXl',
    'GtPiWidthXxl',
    'GtPiWidthXxxl',
];
const SPColumnConfigurationListSelect = [
    'Id',
    'Title',
    'GtManagedProperty',
    'GtFieldDataType',
];

export type SearchQueries = { [id: number]: SearchQuery };

/**
 * Get search queries distinct
 * 
 * @param {ChartConfiguration[]} charts Charts
 */
function getSearchQueriesDistinct(charts: ChartConfiguration[]): SearchQueries {
    return charts.reduce((obj, { searchQuery, fields }) => {
        obj[searchQuery.Id] = obj[searchQuery.Id] || {
            Querytext: '*',
            QueryTemplate: searchQuery.GtSearchQuery,
            RowLimit: 500,
            TrimDuplicates: false,
            SelectProperties: ['Title', 'GtSiteIdOWSTEXT'],
        };
        obj[searchQuery.Id].SelectProperties.push(...fields.map(fld => fld.fieldName));
        return obj;
    }, {});
}

/**
 * Fetch sites
 * 
 * @param {string} siteId Site id
 */
async function fetchSites(siteId: string): Promise<ISPSearchSite[]> {
    return (await sp.search({
        Querytext: `DepartmentId:${siteId} contentclass:STS_Site`,
        TrimDuplicates: false,
        RowLimit: 500,
        SelectProperties: ['Title', 'SiteId'],
        Properties: [{
            Name: "EnableDynamicGroups",
            Value: {
                BoolVal: true,
                QueryPropertyValueTypeIndex: QueryPropertyValueType.BooleanType
            }
        }]
    })).PrimarySearchResults as ISPSearchSite[];
}

/**
 * Get chart data
 * 
 * @param {Object} searchQueries Search queries
 * @param {WebPartContext} context Context
 */
async function fetchChartData(searchQueries: SearchQueries, context: WebPartContext): Promise<{ [id: number]: ChartData }> {
    const sites = await fetchSites(context.pageContext.legacyPageContext.siteId);
    var promises = Object.keys(searchQueries).map(async (id) => {
        try {
            let results = (await sp.search(searchQueries[id])).PrimarySearchResults as any[];
            let items = results
                .map(res => {
                    const [site] = sites.filter(_site => _site.SiteId === res.GtSiteIdOWSTEXT);
                    return site ? new ChartDataItem(site.Title, res) : null;
                })
                .filter(item => item);
            let data = new ChartData(items);
            return { [id]: data };
        } catch (error) {
            return {};
        }
    });
    return (await Promise.all(promises)).reduce((o, d) => ({ ...o, ...d }), {});
}

/**
 * Fetch data
 * 
 * @param {WebPartContext} context Context
 */
export async function fetchData(context: WebPartContext) {
    try {
        const [chartItems, fldItems] = await Promise.all([
            sp.web.lists.getByTitle(strings.SPChartConfigurationList).items
                .select(...SPChartConfigurationListSelect)
                .expand('GtPiDataSourceLookup')
                .get<ISPChartConfiguration[]>(),
            sp.web.lists.getByTitle(strings.SPColumnConfigurationList).items
                .select(...SPColumnConfigurationListSelect)
                .get<ISPColumnConfiguration[]>(),
        ]);
        let charts: ChartConfiguration[] = chartItems.map(item => {
            let fields = item.GtPiFieldsId.map(id => {
                const [fld] = fldItems.filter(_fld => _fld.Id === id);
                return new DataField(fld.Title, fld.GtManagedProperty, fld.GtFieldDataType as DataFieldType);
            });
            let chart = new ChartConfiguration(item, fields);
            return chart;
        });
        let searchQueries = getSearchQueriesDistinct(charts);
        let chartData = await fetchChartData(searchQueries, context);
        charts = charts.map(chart => {
            chart.data = chartData[chart.searchQuery.Id];
            return chart;
        });
        return { charts };
    } catch (error) {
        console.log(error);
        throw strings.ErrorText;
    }
}