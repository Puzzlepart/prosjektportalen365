import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';

export interface IPortfolioOverviewConfiguration {
    columns: PortfolioOverviewColumn[];
    refiners: PortfolioOverviewColumn[];
    views: PortfolioOverviewView[];
    viewNewFormUrl: string;
    viewEditFormUrl: string;
}
