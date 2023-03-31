import { CommandBar } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { useContext } from 'react'
import { FilterPanel } from '../../FilterPanel'
import { PortfolioOverviewContext } from '../context'
import { usePortfolioOverviewCommands } from './usePortfolioOverviewCommands'

export const PortfolioOverviewCommands: React.FC = () => {
  const { props, layerHostId } = useContext(PortfolioOverviewContext)
  const { items, farItems, filters, state, setState } = usePortfolioOverviewCommands()
  return (
    <div hidden={!props.showCommandBar}>
      <CommandBar items={items} farItems={farItems} />
      <FilterPanel
        isOpen={state.showFilterPanel}
        layerHostId={layerHostId}
        headerText={strings.FiltersString}
        onDismiss={() => setState({ showFilterPanel: false })}
        isLightDismiss={true}
        filters={filters}
        onFilterChange={() => {
          // TODO: handle filter change
        }}
      />
    </div>
  )
}
