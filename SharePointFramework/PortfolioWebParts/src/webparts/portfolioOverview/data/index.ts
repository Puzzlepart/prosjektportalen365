import { sp, SearchResult, QueryPropertyValueType } from '@pnp/sp';
import { IPortfolioOverviewConfiguration, PortfolioOverviewView } from '../config';
import { WebPartContext } from '@microsoft/sp-webpart-base';

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
    RowLimit: 500, TrimDuplicates: false,
    Properties: [
        {
            Name: "EnableDynamicGroups",
            Value: {
                BoolVal: true,
                QueryPropertyValueTypeIndex: QueryPropertyValueType.BooleanType
            }
        }
    ],
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
        let queryTemplate = `${view.searchQuery} OR (DepartmentId:{${context.pageContext.site.id.toString()}} contentclass:STS_Site)`;
        const { PrimarySearchResults, RawSearchResults } = await sp.search({
            ...DEFAULT_SEARCH_SETTINGS,
            SelectProperties: [...configuration.columns.map(f => f.fieldName), 'Path', 'contentclass', 'GtSiteIdOWSTEXT', 'SiteId'],
            Refiners: configuration.refiners.map(ref => ref.fieldName).join(','),
            QueryTemplate: queryTemplate,
        });
        const sites = PrimarySearchResults.filter(res => res.contentclass === 'STS_Site');
        const items = sites
            .map(s => {
                const [item] = PrimarySearchResults.filter(res => res['GtSiteIdOWSTEXT'] === s['SiteId']);
                return item ? { ...item, Title: s.Title, Path: s.Path } : null;
            })
            .filter(s => s);
        return { items, refiners: RawSearchResults.PrimaryQueryResult.RefinementResults.Refiners };
    } catch (err) {
        throw err;
    }
}