import * as React from 'react';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { IFilterPanelState } from './IFilterPanelState';
import { IFilterPanelProps } from './IFilterPanelProps';
import { Filter, IFilterProps } from './Filter';
import { IFilterItemProps } from './FilterItem/IFilterItemProps';
import { Customizer } from '@uifabric/utilities';

export class FilterPanel extends React.Component<IFilterPanelProps, IFilterPanelState> {
    public static defaultProps: Partial<IFilterPanelProps> = {};

    constructor(props: IFilterPanelProps) {
        super(props);
        this.state = { filters: props.filters };
    }

    public render(): React.ReactElement<IFilterPanelProps> {
        return (
            <Customizer scopedSettings={{ Layer: { hostId: this.props.layerHostId } }}>
                <Panel
                    isOpen={this.props.isOpen}
                    isLightDismiss={this.props.isLightDismiss}
                    isBlocking={this.props.isBlocking}
                    onDismiss={this.props.onDismiss}
                    headerText={this.props.headerText}
                    hasCloseButton={this.props.hasCloseButton}
                    type={PanelType.smallFixedFar}>
                    <div>
                        {this._renderFilters()}
                    </div>
                </Panel>
            </Customizer>
        );
    }

    private _renderFilters() {
        return this.props.filters
            .filter(props => props.items.length > 1)
            .map(props => <Filter {...props} onFilterChange={this.props.onFilterChange} />);
    }
}

export { IFilterPanelProps, IFilterProps, IFilterItemProps };
