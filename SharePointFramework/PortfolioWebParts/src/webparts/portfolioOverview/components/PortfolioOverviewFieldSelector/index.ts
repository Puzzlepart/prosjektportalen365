import { IPortfolioOverviewFilter } from '../PortfolioOverviewFilterPanel/PortfolioOverviewFilterItem/IFilterItemProps';

const PortfolioOverviewFieldSelector: IPortfolioOverviewFilter = {
    key: 'Fields',
    fieldName: 'Fields',
    name: 'Felter',
    minWidth: 100,
    emptyMessage: 'Det er ikke konfigurert opp noen felter. Ta kontakt med en administrator.',
    items: [],
    isMulti: true,
};

export default PortfolioOverviewFieldSelector;

