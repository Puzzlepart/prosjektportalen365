import { CommandBar } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { FilterPanel, IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { ProjectColumn } from 'pp365-shared-library/lib/models'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../../PortfolioOverview/context'
import { ON_FILTER_CHANGED, TOGGLE_FILTER_PANEL } from '../../PortfolioOverview/reducer'
import { useCommands } from './useCommands'

/**
 * Component for displaying the command bar and filter panel for the `PortfolioOverview` component.
 */
export const Commands: FC = () => {
  const context = useContext(PortfolioOverviewContext)
  const { commandBarProps, filters } = useCommands()
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
