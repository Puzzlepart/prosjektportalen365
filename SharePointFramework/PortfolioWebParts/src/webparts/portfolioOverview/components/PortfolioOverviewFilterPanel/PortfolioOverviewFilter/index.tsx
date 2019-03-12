import * as React from 'react';
import { isArray } from '@pnp/common';
import IPortfolioOverviewFilter from './IPortfolioOverviewFilter';
import PortfolioOverviewFilterItem from '../PortfolioOverviewFilterItem';
import IPortfolioOverviewFilterItem from '../PortfolioOverviewFilterItem/IPortfolioOverviewFilterItem';
import IPortfolioOverviewFilterProps from './IPortfolioOverviewFilterProps';
import IPortfolioOverviewFilterState from './IPortfolioOverviewFilterState';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';

/**
 * PortfolioOverviewFilter
 */
export default class PortfolioOverviewFilter extends React.PureComponent<IPortfolioOverviewFilterProps, IPortfolioOverviewFilterState> {
    public static displayName = 'PortfolioOverviewFilter';

    /**
     * Constructor
     *
     * @param {IPortfolioOverviewFilterProps} props Pros
     */
    constructor(props: IPortfolioOverviewFilterProps) {
        super(props);
        this.state = { isCollapsed: false, filter: props.filter };
    }

    /**
     * Renders the <PortfolioOverviewFilter /> component
    */
    public render(): React.ReactElement<IPortfolioOverviewFilterProps> {
        return (
            <div className='ms-Grid-row' style={{ marginTop: 20 }}>
                <div
                    onClick={this.onExpandCollapse}
                    style={{ cursor: 'pointer', position: 'relative' }}
                    className='ms-Grid-col ms-sm12 ms-font-m'>
                    <span>{this.state.filter.name}</span>
                    <span style={{ position: 'absolute', right: 0 }}>
                        <Icon iconName={this.state.isCollapsed ? 'ChevronUp' : 'ChevronDown'} />
                    </span>
                </div>
                <div className='ms-Grid-col ms-sm12' hidden={this.state.isCollapsed}>
                    <ul style={{ margin: '10px 0 0 0', padding: 0, listStyleType: 'none' }}>
                        {this.renderItems()}
                    </ul>
                </div>
            </div>
        );
    }

    /**
     * Render filter items
     */
    private renderItems() {
        const { filter } = this.state;
        if (filter) {
            return filter.items.map((item, idx) => {
                return (
                    <PortfolioOverviewFilterItem
                        key={`PortfolioOverviewFilterItem_${idx}`}
                        filter={filter}
                        item={item}
                        className='ms-font-m'
                        style={{ padding: 2, marginBottom: 2 }}
                        onChanged={this.onChange} />
                );
            });
        }
        return null;
    }

    /**
     * On expand/collapse
     */
    @autobind
    private onExpandCollapse() {
        this.setState((prevState: IPortfolioOverviewFilterState) => ({ isCollapsed: !prevState.isCollapsed }));
    }

    /**
     * On filter change
     *
     * @param {IPortfolioOverviewFilterItem} item The filter item
     * @param {boolean} checked Is the item checked
     */
    @autobind
    private onChange(item: IPortfolioOverviewFilterItem, checked: boolean) {
        const { filter } = this.state;
        filter.items.filter(itm => itm.value === item.value)[0].selected = checked;
        filter.selected = filter.items.filter(itm => itm.selected).map(itm => itm.value);
        this.setState({ filter: filter });
        this.props.onFilterChange(filter);
    }
}

export { IPortfolioOverviewFilter };

