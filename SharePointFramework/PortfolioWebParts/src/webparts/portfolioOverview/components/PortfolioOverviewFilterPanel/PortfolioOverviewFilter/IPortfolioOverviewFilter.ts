import IPortfolioOverviewFilterItem from '../PortfolioOverviewFilterItem/IPortfolioOverviewFilterItem';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export default interface IPortfolioOverviewFilter extends IColumn {
    emptyMessage: string;
    items: IPortfolioOverviewFilterItem[];
    selected?: string[];
    isMulti?: boolean;
}
