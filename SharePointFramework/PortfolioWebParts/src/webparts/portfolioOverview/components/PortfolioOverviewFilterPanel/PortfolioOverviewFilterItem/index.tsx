import * as React from 'react';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import IPortfolioOverviewFilterItemProps from './IPortfolioOverviewFilterItemProps';

/**
 * PortfolioOverviewFilter Item
 *
 * @param {IPortfolioOverviewFilterItemProps} param0 Props
 */
const PortfolioOverviewFilterItem = (props: IPortfolioOverviewFilterItemProps) => {
    return (
        <li>
            <div className={props.className} style={props.style}>
                <Checkbox
                    label={props.item.name}
                    disabled={props.item.readOnly}
                    defaultChecked={props.item.selected}
                    onChange={(_event, checked) => props.onChanged(props.item, checked)} />
            </div>
        </li>
    );
};

export default PortfolioOverviewFilterItem;
