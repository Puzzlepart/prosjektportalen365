import IPortfolioOverviewFilter from './IPortfolioOverviewFilter';

export default interface IPortfolioOverviewFilterState {
    isCollapsed: boolean;
    filter?: IPortfolioOverviewFilter;
}
