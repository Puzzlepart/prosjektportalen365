import { IPortfolioOverviewConfiguration, PortfolioOverviewView } from '../../../portfolioOverview/config';

export interface IPortfolioInsightsCommandBarProps {
    currentView: PortfolioOverviewView;
    configuration: IPortfolioOverviewConfiguration;
    contentTypes: {
        StringId: string;
        Name: string;
        NewFormUrl: string;
    }[];
    onViewChanged: (view: PortfolioOverviewView) => Promise<void>;
}
