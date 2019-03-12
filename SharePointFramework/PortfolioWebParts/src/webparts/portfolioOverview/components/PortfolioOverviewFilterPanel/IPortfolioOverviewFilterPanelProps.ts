import { IPortfolioOverviewFilter } from './PortfolioOverviewFilterItem/IFilterItemProps';

export interface IPortfolioOverviewFilterPanelProps {
    filters: IPortfolioOverviewFilter[];
    onFilterChange: (filter: IPortfolioOverviewFilter) => void;
    onDismiss: () => void;
    isOpen: boolean;
    showIcons?: boolean;
}
