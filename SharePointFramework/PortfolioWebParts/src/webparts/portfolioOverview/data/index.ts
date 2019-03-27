import { sp, SearchResult, QueryPropertyValueType, SortDirection } from '@pnp/sp';
import { IPortfolioOverviewConfiguration, PortfolioOverviewView } from '../config';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import * as objectGet from 'object-get';

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

/**
 * Query the REST Search API using @pnp/sp
 *
 * @param {PortfolioOverviewView} view View configuration
 * @param {IPortfolioOverviewConfiguration} configuration PortfolioOverviewConfiguration
 * @param {WebPartContext} context Context
 */
export async function fetchData(view: PortfolioOverviewView, configuration: IPortfolioOverviewConfiguration, context: WebPartContext): Promise<IFetchDataResponse> {
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
                QueryTemplate: `DepartmentId:{${context.pageContext.site.id.toString()}} contentclass:STS_Site`,
                SelectProperties: ['Path', 'Title', 'SiteId'],
            }),
            sp.search({
                ...DEFAULT_SEARCH_SETTINGS,
                QueryTemplate: `DepartmentId:{${context.pageContext.site.id.toString()}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5*`,
                SelectProperties: [...configuration.columns.map(f => f.fieldName), 'GtSiteIdOWSTEXT'],
                Refiners: configuration.refiners.map(ref => ref.fieldName).join(','),
            }),
        ]);

        let refiners = objectGet(projectsResults, 'RawSearchResults.PrimaryQueryResult.RefinementResults.Refiners') || [];
        let projects: any[] = objectGet(projectsResults, 'PrimarySearchResults') || [];
        let sites: any[] = objectGet(sitesResults, 'PrimarySearchResults') || [];
        let statusReports: any[] = objectGet(statusReportsResults, 'PrimarySearchResults') || [];

        let items = sites
            .map(site => {
                const [project] = projects.filter(res => res.GtSiteIdOWSTEXT === site.SiteId);
                const [statusReport] = statusReports.filter(res => res.GtSiteIdOWSTEXT === site.SiteId);
                return project ? { ...statusReport, ...project, Title: site.Title, Path: site.Path } : null;
            })
            .filter(i => i);
        return { items, refiners };
    } catch (err) {
        throw err;
    }
}