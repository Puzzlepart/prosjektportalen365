import { IPortfolioOverviewConfiguration, PortfolioOverviewView } from '../../portfolioOverview/config';
import { ChartConfiguration,ChartData } from '../models';


export interface IPortfolioInsightsState {
    isLoading: boolean;
    chartData?: ChartData;
    charts?: ChartConfiguration[];
    contentTypes?: { StringId: string, Name: string, NewFormUrl: string }[];
    currentView?: PortfolioOverviewView;
    configuration?: IPortfolioOverviewConfiguration;
    error?: string;
}
