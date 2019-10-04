import { IPortfolioConfiguration } from 'interfaces';
import { PortfolioOverviewView } from 'shared/lib/models/PortfolioOverviewView';

export interface IPortfolioInsightsCommandBarProps {
    currentView: PortfolioOverviewView;
    configuration: IPortfolioConfiguration;
    contentTypes: {
        StringId: string;
        Name: string;
        NewFormUrl: string;
    }[];
    onViewChanged: (view: PortfolioOverviewView) => Promise<void>;
}
