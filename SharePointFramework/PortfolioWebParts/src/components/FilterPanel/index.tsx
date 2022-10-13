import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel'
import { Customizer } from 'office-ui-fabric-react/lib/Utilities'
import * as React from 'react'
import { Filter } from './Filter'
import { IFilterPanelProps } from './types'

export const FilterPanel: React.FunctionComponent<IFilterPanelProps> = (props) => {
  return (
    <Customizer scopedSettings={{ Layer: { hostId: props.layerHostId } }}>
      <Panel {...props} type={PanelType.smallFixedFar}>
        <div>
          {props.filters
            .filter((f) => f.items.length > 1)
            .map((f, idx) => (
              <Filter {...f} key={idx} onFilterChange={props.onFilterChange} />
            ))}
        </div>
      </Panel>
    </Customizer>
  )
}

export * from './FilterItem/types'
export * from './Filter/types'
export * from './types'
