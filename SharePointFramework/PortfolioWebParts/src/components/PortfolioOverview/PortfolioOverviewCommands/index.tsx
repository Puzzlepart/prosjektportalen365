import { CommandBar } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { useContext } from 'react'
import { FilterPanel } from '../../FilterPanel'
import { PortfolioOverviewContext } from '../context'
import { TOGGLE_FILTER_PANEL } from '../reducer'
import { IPortfolioOverviewCommandsProps } from './types'
import { usePortfolioOverviewCommands } from './usePortfolioOverviewCommands'

export const PortfolioOverviewCommands: React.FC<IPortfolioOverviewCommandsProps> = (props) => {
  const context = useContext(PortfolioOverviewContext)
  const { items, farItems, filters } = usePortfolioOverviewCommands(props)
  return (
    <div hidden={!context.props.showCommandBar}>
      <CommandBar items={items} farItems={farItems} />
      <FilterPanel
        isOpen={context.state.showFilterPanel}
        layerHostId={context.layerHostId}
        headerText={strings.FiltersString}
        onDismiss={() => context.dispatch(TOGGLE_FILTER_PANEL())}
        isLightDismiss={true}
        filters={filters}
        onFilterChange={() => {
          // TODO: handle filter change
        }}
      />
    </div>
  )
}
