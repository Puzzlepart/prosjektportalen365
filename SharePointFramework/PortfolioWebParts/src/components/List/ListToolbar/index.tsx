import { Toolbar } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { FilterPanel } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useListContext } from '../context'
import { renderToolbarItem } from './renderToolbarItem'

export const ListToolbar: FC = () => {
  const context = useListContext()
  return (
    <div>
      <Toolbar aria-label='Default'>{context.props.menuItems.map(renderToolbarItem)}</Toolbar>
      <FilterPanel
        {...context.props.filterPanelProps}
        headerText={strings.FiltersString}
        isLightDismiss={true}
      />
    </div>
  )
}
