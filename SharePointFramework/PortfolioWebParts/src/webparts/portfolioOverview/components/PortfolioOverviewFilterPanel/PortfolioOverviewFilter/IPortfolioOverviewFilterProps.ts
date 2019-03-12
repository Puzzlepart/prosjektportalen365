import IPortfolioOverviewFilter from './IPortfolioOverviewFilter';

export default interface IPortfolioOverviewFilterProps {
    filter?: IPortfolioOverviewFilter;
    onFilterChange?: (filter: IPortfolioOverviewFilter) => void;
}
