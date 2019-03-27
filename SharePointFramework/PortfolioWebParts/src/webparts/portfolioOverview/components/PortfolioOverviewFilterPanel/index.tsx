import * as React from 'react';
import { Panel, PanelType, } from 'office-ui-fabric-react/lib/Panel';
import { IPortfolioOverviewFilterPanelProps } from './IPortfolioOverviewFilterPanelProps';
import PortfolioOverviewFilter from './PortfolioOverviewFilter';

/**
 * PortfolioOverviewFilter Panel
 *
 * @param {IPortfolioOverviewFilterPanelProps} props Props
 */
const PortfolioOverviewFilterPanel = ({ filters, onDismiss, isOpen, onFilterChange }: IPortfolioOverviewFilterPanelProps) => {
    return (
        <Panel
            isOpen={isOpen}
            isBlocking={true}
            onDismiss={onDismiss}
            headerText='Filtrer'
            type={PanelType.smallFixedFar}>
            <div className="ms-Grid">
                {filters
                    .filter(filter => filter.items.length > 1)
                    .map((filter, idx) => (
                        <PortfolioOverviewFilter
                            key={idx}
                            filter={filter}
                            onFilterChange={onFilterChange} />
                    ))}
            </div>
        </Panel>
        );
};

export default PortfolioOverviewFilterPanel;

