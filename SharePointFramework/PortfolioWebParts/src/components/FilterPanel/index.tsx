import * as React from 'react';
import { Panel, IPanelProps } from 'office-ui-fabric-react/lib/Panel';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IFilterProps, Filter } from './Filter';

export interface IFilterPanelProps extends IPanelProps {
    filters: IFilterProps[];
    onFilterChange: (column: IColumn, selectedItems: string[]) => void;
}

export interface IFilterPanelState {
    filters: IFilterProps[];
}

export default class FilterPanel extends React.Component<IFilterPanelProps, IFilterPanelState> {
    public static defaultProps: Partial<IFilterPanelProps> = {};

    constructor(props: IFilterPanelProps) {
        super(props);
        this.state = { filters: props.filters };
    }

    public render(): React.ReactElement<IFilterPanelProps> {
        return (
            <Panel
                isOpen={this.props.isOpen}
                isBlocking={this.props.isBlocking}
                onDismiss={this.props.onDismiss}
                headerText={this.props.headerText}
                type={this.props.type}>
                <div>
                    {this.renderFilters()}
                </div>
            </Panel>
        );
    }

    private renderFilters() {
        return this.props.filters
            .filter(props => props.items.length > 1)
            .map(props => <Filter {...props} onFilterChange={this.props.onFilterChange} />);
    }
}

export { IFilterProps };
