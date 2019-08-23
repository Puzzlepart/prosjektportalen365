import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';

export interface IPortfolioOverviewConfiguration {
    columns: PortfolioOverviewColumn[];
    refiners: PortfolioOverviewColumn[];
    views: PortfolioOverviewView[];
    viewNewFormUrl: string;
    viewEditFormUrl: string;
    colNewFormUrl: string;
    colEditFormUrl: string;
    showFields: { InternalName: string, Title: string }[];
}
