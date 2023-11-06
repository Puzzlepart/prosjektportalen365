import { Panel, PanelType } from '@fluentui/react'
import React, { FC } from 'react'
import { Filter } from './Filter/Filter'
import { IFilterPanelProps } from './types'

export const FilterPanel: FC<IFilterPanelProps> = (props) => {
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
