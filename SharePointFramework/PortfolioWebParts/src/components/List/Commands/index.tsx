import { Toolbar, ToolbarButton } from '@fluentui/react-components'
import { ArrowExportUp24Regular, Filter24Regular, ViewDesktop24Regular } from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { FilterPanel } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useListContext } from '../context'

export const Commands: FC = () => {
  const context = useListContext()
  return (
    <div>
      <Toolbar aria-label='Default'>

        <ToolbarButton icon={<ArrowExportUp24Regular />} />
        <ToolbarButton icon={<ViewDesktop24Regular />}>
          Alle prosjekter
        </ToolbarButton>
        <ToolbarButton icon={<Filter24Regular />} />
      </Toolbar>
      <FilterPanel
        {...context.props.filterPanelProps}
        headerText={strings.FiltersString}
        isLightDismiss={true}
      />
    </div>
  )
}
