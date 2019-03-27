import * as React from 'react';
import { Panel, PanelType, IPanelProps } from 'office-ui-fabric-react/lib/Panel';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import styles from './ResourceAllocationFilterPanel.module.scss';

export interface IResourceAllocationFilterItemProps {
    name: string;
    selected?: boolean;
    onChanged?: (event: React.FormEvent<HTMLElement | HTMLInputElement>, checked: boolean) => void;
}

export interface IResourceAllocationFilterItemState { }

export class ResourceAllocationFilterItem extends React.Component<IResourceAllocationFilterItemProps, IResourceAllocationFilterItemState> {
    constructor(props: IResourceAllocationFilterItemProps) {
        super(props);
        this.state = {};
    }

    public render(): React.ReactElement<IResourceAllocationFilterItemProps> {
        return (
            <li>
                <div className={styles.filterSectionItem}>
                    <Checkbox
                        label={this.props.name}
                        defaultChecked={this.props.selected}
                        onChange={this.props.onChanged} />
                </div>
            </li>
        );
    }
}


export interface IResourceAllocationFilterProps {
    column: IColumn;
    items: IResourceAllocationFilterItemProps[];
    onFilterChange?: (column: IColumn, selectedItems: string[]) => void;
}

export interface IResourceAllocationFilterState {
    isCollapsed: boolean;
    items: IResourceAllocationFilterItemProps[];
}

export class ResourceAllocationFilter extends React.Component<IResourceAllocationFilterProps, IResourceAllocationFilterState> {
    constructor(props: IResourceAllocationFilterProps) {
        super(props);
        this.state = { isCollapsed: false, items: props.items };
    }

    public render(): React.ReactElement<IResourceAllocationFilterProps> {
        return (
            <div className={styles.resourceAllocationFilter}>
                <div className={styles.filterSectionHeader}>
                    <span>{this.props.column.name}</span>
                    <span style={{ position: 'absolute', right: 0 }}>
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
     * Render filter items
     */
    private renderItems() {
        return this.state.items.map(props => <ResourceAllocationFilterItem {...props} onChanged={(event, checked) => this.onChanged(props, checked)} />);
    }

    @autobind
    private onChanged(item: IResourceAllocationFilterItemProps, checked: boolean) {
        const { items } = this.state;
        items.filter(_item => _item.name === item.name)[0].selected = checked;
        this.setState({ items });
        const selectedItems = items.filter(i => i.selected).map(i => i.name);
        this.props.onFilterChange(this.props.column, selectedItems);
    }
}


export interface IResourceAllocationFilterPanelProps extends IPanelProps {
    filters: IResourceAllocationFilterProps[];
    onFilterChange: (column: IColumn, selectedItems: string[]) => void;
}

export interface IResourceAllocationFilterPanelState {
    filters: IResourceAllocationFilterProps[];
}

export default class ResourceAllocationFilterPanel extends React.Component<IResourceAllocationFilterPanelProps, IResourceAllocationFilterPanelState> {
    public static defaultProps: Partial<IResourceAllocationFilterPanelProps> = {};

    constructor(props: IResourceAllocationFilterPanelProps) {
        super(props);
        this.state = { filters: props.filters };
    }

    public render(): React.ReactElement<IResourceAllocationFilterPanelProps> {
        return (
            <Panel
                isOpen={this.props.isOpen}
                isBlocking={this.props.isBlocking}
                onDismiss={this.props.onDismiss}
                headerText={this.props.headerText}
                type={this.props.type}>
                <div className={styles.resourceAllocationFilterPanel}>
                    {this.renderFilters()}
                </div>
            </Panel>
        );
    }

    private renderFilters() {
        return this.props.filters
            .filter(props => props.items.length > 1)
            .map(props => <ResourceAllocationFilter {...props} onFilterChange={this.props.onFilterChange} />);
    }
}
