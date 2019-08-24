import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import { IPortfolioOverviewProps } from '../IPortfolioOverviewProps';
import { IPortfolioOverviewState } from '../IPortfolioOverviewState';
import { IFilterItemProps } from 'components';

export interface IPortfolioOverviewCommandsEvents {
    onSetCompact: (isCompact: boolean) => void;
    onChangeView: (view: PortfolioOverviewView) => void;
    onFilterChange: (column: PortfolioOverviewColumn, selectedItems: IFilterItemProps[]) => void;
}

export interface IPortfolioOverviewCommandsProps extends Partial<IPortfolioOverviewProps>, Partial<IPortfolioOverviewState>, React.HTMLProps<HTMLDivElement> {
    fltItems: any[];
    fltColumns: PortfolioOverviewColumn[];
    events: IPortfolioOverviewCommandsEvents;
    layerHostId: string;
}
