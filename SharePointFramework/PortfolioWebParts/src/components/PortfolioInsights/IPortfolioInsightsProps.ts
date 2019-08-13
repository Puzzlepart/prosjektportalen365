import { PageContext } from '@microsoft/sp-page-context';
import * as PortfolioInsightsWebPartStrings from 'PortfolioInsightsWebPartStrings';

export interface IPortfolioInsightsProps {
    pageContext: PageContext;
    title?: string;
}

export const PortfolioInsightsDefaultProps: Partial<IPortfolioInsightsProps> = {
    title: PortfolioInsightsWebPartStrings.Title,
};
