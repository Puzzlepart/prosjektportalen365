
import { ChartConfiguration, ChartData, PortfolioOverviewView } from 'models';
import { IPortfolioOverviewConfiguration } from 'interfaces';


export interface IPortfolioInsightsState {
    isLoading: boolean;
    chartData?: ChartData;
    charts?: ChartConfiguration[];
    contentTypes?: { StringId: string, Name: string, NewFormUrl: string }[];
    currentView?: PortfolioOverviewView;
    configuration?: IPortfolioOverviewConfiguration;
    error?: string;
}
