import { Customizer } from '@uifabric/utilities'
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel'
import React, { Component } from 'react'
import { Filter, IFilterProps } from './Filter'
import { IFilterItemProps } from './FilterItem/IFilterItemProps'
import { IFilterPanelProps, IFilterPanelState } from './types'

/**
 * @component FilterPanel
 * @extends Component
 */
export class FilterPanel extends Component<IFilterPanelProps, IFilterPanelState> {
  public static defaultProps: Partial<IFilterPanelProps> = {}

  constructor(props: IFilterPanelProps) {
    super(props)
    this.state = { filters: props.filters }
  }

  public render(): React.ReactElement<IFilterPanelProps> {
    return (
      <Customizer scopedSettings={{ Layer: { hostId: this.props.layerHostId } }}>
        <Panel {...this.props} type={PanelType.smallFixedFar}>
          <div>{this._renderFilters()}</div>
        </Panel>
      </Customizer>
    )
  }

  private _renderFilters() {
    return this.props.filters
      .filter((props) => props.items.length > 1)
      .map((props, idx) => (
        <Filter key={idx} {...props} onFilterChange={this.props.onFilterChange} />
      ))
  }
}

export { IFilterPanelProps, IFilterProps, IFilterItemProps }
