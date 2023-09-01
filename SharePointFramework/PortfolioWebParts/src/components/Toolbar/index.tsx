import { Toolbar as ReactToolbar } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { FilterPanel } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useToolbarContext } from './context'
import { renderToolbarItem } from './renderToolbarItem'
import styles from './ListToolbar.module.scss'
import { IToolbarProps } from './types'

export const Toolbar: FC<IToolbarProps> = () => {
  const context = useToolbarContext()
  return (
    <div>
      <ReactToolbar className={styles.toolbar}>{context.props.menuItems.map(renderToolbarItem)}</ReactToolbar>
      <FilterPanel
        {...context.props.filterPanelProps}
        headerText={strings.FiltersString}
        isLightDismiss={true}
      />
    </div>
  )
}

export * from './types'
