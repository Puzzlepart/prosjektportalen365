import { CommandBar } from '@fluentui/react'
import React, { FC } from 'react'
import { useListContext } from '../context'
import { FilterPanel } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'

export const Commands: FC = () => {
  const context = useListContext()
  return (
    <div>
      <CommandBar {...context.props.commandBarProps} />
      <FilterPanel
        {...context.props.filterPanelProps}
        headerText={strings.FiltersString}
        isLightDismiss={true}
      />
    </div>
  )
}
