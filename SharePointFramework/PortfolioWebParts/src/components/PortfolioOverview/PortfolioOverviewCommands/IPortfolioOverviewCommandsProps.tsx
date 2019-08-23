import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import { IPortfolioOverviewProps } from '../IPortfolioOverviewProps';
import { IPortfolioOverviewState } from '../IPortfolioOverviewState';
import { IFilterItemProps } from 'components';

export interface IPortfolioOverviewCommandsProps extends Partial<IPortfolioOverviewProps>, Partial<IPortfolioOverviewState> {
    items: any[];
    columns: PortfolioOverviewColumn[];
    onGroupBy: (column: PortfolioOverviewColumn) => void;
    onSetCompact: (isCompact: boolean) => void;
    onChangeView: (view: PortfolioOverviewView) => void;
    onFilterChange: (column: PortfolioOverviewColumn, selectedItems: IFilterItemProps[]) => void;
}
