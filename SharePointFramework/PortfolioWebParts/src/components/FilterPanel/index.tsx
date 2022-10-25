import { Panel, PanelType } from '@fluentui/react'
import React, { FunctionComponent } from 'react'
import { Filter } from './Filter'
import { IFilterPanelProps } from './types'

export const FilterPanel: FunctionComponent<IFilterPanelProps> = (props) => {
  return (
    <Panel {...props} type={PanelType.smallFixedFar}>
      <div>
        {props.filters
          .filter((f) => f.items.length > 1)
          .map((f, idx) => (
            <Filter {...f} key={idx} onFilterChange={props.onFilterChange} />
          ))}
      </div>
    </Panel>
  )
}

export * from './Filter/types'
export * from './FilterItem/types'
export * from './types'
