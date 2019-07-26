import { QueryPropertyValueType, SearchResults, SortDirection, sp } from '@pnp/sp';
import * as cleanDeep from 'clean-deep';
import * as objectGet from 'object-get';
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import * as strings from 'PortfolioOverviewWebPartStrings';
import { IPortfolioOverviewConfiguration, PortfolioOverviewView } from '../config';

export interface IRefinementResultEntry {
    RefinementCount: string;
    RefinementName: string;
    RefinementToken: string;
    RefinementValue: string;
}

export interface IRefinementResult {
    Name: string;
    Entries: IRefinementResultEntry[];
}

export interface IFetchDataResponse {
    items: any[];
    refiners: IRefinementResult[];
}

/**
 * Default Search Settings used for @pnp/sp
 */
export const DEFAULT_SEARCH_SETTINGS = {
    Querytext: '*',
    RowLimit: 500,
    TrimDuplicates: false,
    Properties: [
        {
            Name: "EnableDynamicGroups",
            Value: {
                BoolVal: true,
                QueryPropertyValueTypeIndex: QueryPropertyValueType.BooleanType
            }
        }
    ],
    SortList: [{ Property: 'LastModifiedTime', Direction: SortDirection.Descending }],
};

/**
 * Map search results
 * 
 * @param {SearchResults} results Search reulsts
 */
function mapSearchResults(results: SearchResults) {
    let items: any[] = objectGet(results, 'PrimarySearchResults') || [];
    items = items.map(item => cleanDeep({ ...item }));
    return items;
}

/**
 * Query the REST Search API using @pnp/sp
 *
 * @param {PortfolioOverviewView} view View configuration
 * @param {IPortfolioOverviewConfiguration} configuration PortfolioOverviewConfiguration
 * @param {string} siteId Site ID
 * @param {string} siteIdProperty Site ID property
 */
export async function fetchData(view: PortfolioOverviewView, configuration: IPortfolioOverviewConfiguration, siteId: string, siteIdProperty: string = 'GtSiteIdOWSTEXT'): Promise<IFetchDataResponse> {
    try {
        const [projectsRes, sitesRes, statusReportsRes] = await Promise.all([
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

        let refiners = objectGet(projectsRes, 'RawSearchResults.PrimaryQueryResult.RefinementResults.Refiners') || [];
        let projects = mapSearchResults(projectsRes);
        let sites = mapSearchResults(sitesRes);
        let statusReports = mapSearchResults(statusReportsRes);
        let validSites = sites.filter(({ SiteId }) => projects.filter(res => res[siteIdProperty] === SiteId).length === 1);
        let items = validSites.map(({ SiteId, Title, Path }) => {
            const [project] = projects.filter(res => res[siteIdProperty] === SiteId);
            const [statusReport] = statusReports.filter(res => res[siteIdProperty] === SiteId);
            return { ...statusReport, ...project, Title, Path };
        });
        return { items, refiners };
    } catch (err) {
        throw {
            message: strings.FetchDataErrorMessage,
            type: MessageBarType.error
        };
    }
}