import { ChartConfiguration } from "../models/ChartConfiguration";

export interface IPortfolioInsightsState  {
    isLoading: boolean;
    charts?: ChartConfiguration[];
    error?: string;
}
