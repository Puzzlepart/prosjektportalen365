import * as React from 'react';
import styles from './Filter.module.scss';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { IFilterState } from './IFilterState';
import { IFilterProps } from './IFilterProps';
import { FilterItem } from '../FilterItem';
import { IFilterItemProps } from '../FilterItem/IFilterItemProps';

export class Filter extends React.Component<IFilterProps, IFilterState> {
    constructor(props: IFilterProps) {
        super(props);
        this.state = { isCollapsed: props.defaultCollapsed, items: props.items };
    }

    public render(): React.ReactElement<IFilterProps> {
        return (
            <div className={styles.filter}>
                <div className={styles.filterSectionHeader} onClick={this.onToggleSectionContent}>
                    <span className={styles.titleText}>{this.props.column.name}</span>
                    <span className={styles.titleIcon}>
                        <Icon iconName={this.state.isCollapsed ? 'ChevronUp' : 'ChevronDown'} />
                    </span>
                </div>
                <div hidden={this.state.isCollapsed}>
                    <ul className={styles.filterSectionContent}>
                        {this.renderItems()}
                    </ul>
                </div>
            </div>
        );
    }

    /**
     * On toggle section content
     */
    private onToggleSectionContent = () => {
        this.setState((prevState: IFilterState) => ({ isCollapsed: !prevState.isCollapsed }));
    }

    /**
     * Render filter items
     */
    private renderItems() {
        return this.state.items.map(props => <FilterItem {...props} onChanged={(event, checked) => this.onChanged(props, checked)} />);
    }

    /**
     * On changed
     * 
     * @param {IFilterItemProps} item Item that was changed
     * @param {boolean} checked Item checked
     */
    private onChanged = (item: IFilterItemProps, checked: boolean) => {
        const { items } = this.state;
        items.filter(_item => _item.value === item.value)[0].selected = checked;
        this.setState({ items });
        const selectedItems = items.filter(i => i.selected);
        this.props.onFilterChange(this.props.column, selectedItems);
    }
}

export { IFilterProps };