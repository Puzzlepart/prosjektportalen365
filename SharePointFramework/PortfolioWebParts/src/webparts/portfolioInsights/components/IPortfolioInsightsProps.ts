import { PageContext } from '@microsoft/sp-page-context';
import * as PortfolioInsightsWebPartStrings from 'PortfolioInsightsWebPartStrings';
import { IPortfolioInsightsWebPartProps } from '../IPortfolioInsightsWebPartProps';

export interface IPortfolioInsightsProps extends IPortfolioInsightsWebPartProps {
    pageContext: PageContext;
    title?: string;
}

export const PortfolioInsightsDefaultProps: Partial<IPortfolioInsightsProps> = {
    title: PortfolioInsightsWebPartStrings.Title,
};
