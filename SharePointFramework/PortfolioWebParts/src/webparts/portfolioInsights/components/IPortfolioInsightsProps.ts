import { IPortfolioInsightsWebPartProps } from "../IPortfolioInsightsWebPartProps";
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IPortfolioInsightsProps extends IPortfolioInsightsWebPartProps {
    context: WebPartContext;
}
