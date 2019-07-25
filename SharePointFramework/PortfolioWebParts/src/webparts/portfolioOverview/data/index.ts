import { PageContext } from '@microsoft/sp-page-context';
import { QueryPropertyValueType, SearchResult, SearchResults, SortDirection, sp } from '@pnp/sp';
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
    items: SearchResult[];
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

function mapSearchResultData(results: SearchResults) {
    let items: SearchResult[] = objectGet(results, 'PrimarySearchResults') || [];
    items = items.map(item => cleanDeep({ ...item }));
    return items;
}

/**
 * Query the REST Search API using @pnp/sp
 *
 * @param {PortfolioOverviewView} view View configuration
 * @param {IPortfolioOverviewConfiguration} configuration PortfolioOverviewConfiguration
 * @param {PageContext} pageContext Page context
 */
export async function fetchData(view: PortfolioOverviewView, configuration: IPortfolioOverviewConfiguration, pageContext: PageContext): Promise<IFetchDataResponse> {
    try {
        const [projectsResults, sitesResults, statusReportsResults] = await Promise.all([
            sp.search({
                ...DEFAULT_SEARCH_SETTINGS,
                QueryTemplate: view.searchQuery,
                SelectProperties: [...configuration.columns.map(f => f.fieldName), 'GtSiteIdOWSTEXT'],
                Refiners: configuration.refiners.map(ref => ref.fieldName).join(','),
            }),
            sp.search({
                ...DEFAULT_SEARCH_SETTINGS,
                QueryTemplate: `DepartmentId:{${pageContext.site.id.toString()}} contentclass:STS_Site`,
                SelectProperties: ['Path', 'Title', 'SiteId'],
            }),
            sp.search({
                ...DEFAULT_SEARCH_SETTINGS,
                QueryTemplate: `DepartmentId:{${pageContext.site.id.toString()}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5*`,
                SelectProperties: [...configuration.columns.map(f => f.fieldName), 'GtSiteIdOWSTEXT'],
                Refiners: configuration.refiners.map(ref => ref.fieldName).join(','),
            }),
        ]);

        let refiners = objectGet(projectsResults, 'RawSearchResults.PrimaryQueryResult.RefinementResults.Refiners') || [];
        let projects: any[] = mapSearchResultData(projectsResults);
        let sites: any[] = mapSearchResultData(sitesResults);
        let statusReports: any[] = mapSearchResultData(statusReportsResults);

        let items = sites
            .map(site => {
                const [project] = projects.filter(res => res.GtSiteIdOWSTEXT === site.SiteId);
                const [statusReport] = statusReports.filter(res => res.GtSiteIdOWSTEXT === site.SiteId);
                return project ? { ...statusReport, ...project, Title: site.Title, Path: site.Path } : null;
            })
            .filter(i => i);
        return { items, refiners };
    } catch (err) {
        throw {
            message: strings.FetchDataErrorMessage,
            type: MessageBarType.error
        };
    }
}