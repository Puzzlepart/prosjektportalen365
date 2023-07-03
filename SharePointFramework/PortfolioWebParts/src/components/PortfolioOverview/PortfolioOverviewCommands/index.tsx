import { CommandBar } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectColumn } from 'pp365-shared-library/lib/models'
import React, { useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import { ON_FILTER_CHANGED, TOGGLE_FILTER_PANEL } from '../reducer'
import { IPortfolioOverviewCommandsProps } from './types'
import { usePortfolioOverviewCommands } from './usePortfolioOverviewCommands'
import { FilterPanel, IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'

/**
 * Component for displaying the command bar and filter panel.
 */
export const PortfolioOverviewCommands: React.FC<IPortfolioOverviewCommandsProps> = (props) => {
  const context = useContext(PortfolioOverviewContext)
  const { commandBarProps, filters } = usePortfolioOverviewCommands(props)
  return (
    <div hidden={!context.props.showCommandBar}>
      <CommandBar {...commandBarProps} />
      <FilterPanel
        isOpen={context.state.isFilterPanelOpen}
        layerHostId={context.layerHostId}
        headerText={strings.FiltersString}
        onDismiss={() => context.dispatch(TOGGLE_FILTER_PANEL())}
        isLightDismiss={true}
        filters={filters}
        onFilterChange={(column: ProjectColumn, selectedItems: IFilterItemProps[]) => {
          context.dispatch(ON_FILTER_CHANGED({ column, selectedItems }))
        }}
      />
    </div>
  )
}
