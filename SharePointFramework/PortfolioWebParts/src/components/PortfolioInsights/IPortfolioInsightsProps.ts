import { PageContext } from '@microsoft/sp-page-context';

export interface IPortfolioInsightsProps {
    pageContext: PageContext;
    title?: string;
}

export const PortfolioInsightsDefaultProps: Partial<IPortfolioInsightsProps> = {};
