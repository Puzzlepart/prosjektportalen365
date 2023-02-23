import { CommandBar } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { FilterPanel } from '../../FilterPanel'
import { IPortfolioOverviewCommandsProps } from './types'
import { usePortfolioOverviewCommands } from './usePortfolioOverviewCommands'

export const PortfolioOverviewCommands: React.FC<IPortfolioOverviewCommandsProps> = (props) => {
  const { items, farItems, filters, state, setState } = usePortfolioOverviewCommands(props)
  return (
    <div className={props.className} hidden={props.hidden}>
    <CommandBar items={items} farItems={farItems} />
    <FilterPanel
      isOpen={state.showFilterPanel}
      layerHostId={props.layerHostId}
      headerText={strings.FiltersString}
      onDismiss={() => setState({ showFilterPanel: false })}
      isLightDismiss={true}
      filters={filters}
      onFilterChange={props.events.onFilterChange}
    />
  </div>
  )
}