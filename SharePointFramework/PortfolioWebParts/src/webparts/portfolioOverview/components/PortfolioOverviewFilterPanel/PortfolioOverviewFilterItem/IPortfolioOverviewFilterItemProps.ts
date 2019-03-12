import IPortfolioOverviewFilter from "../PortfolioOverviewFilter/IPortfolioOverviewFilter";
import IPortfolioOverviewFilterItem from "./IPortfolioOverviewFilterItem";

export default interface IPortfolioOverviewFilterItemProps extends React.HTMLAttributes<HTMLElement> {
    filter: IPortfolioOverviewFilter;
    item: IPortfolioOverviewFilterItem;
    onChanged: (item: any, checked: boolean) => void;
}

export { IPortfolioOverviewFilter };

