import { Toolbar as ReactToolbar } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { FilterPanel } from 'pp365-shared-library'
import React, { FC } from 'react'
import { renderToolbarItem } from './renderToolbarItem'
import styles from './ListToolbar.module.scss'
import { IToolbarProps } from './types'

export const Toolbar: FC<IToolbarProps> = (props) => {
  const context = props.context

  return (
    <div>
      <ReactToolbar className={styles.toolbar}>{context.menuItems.map(renderToolbarItem)}</ReactToolbar>
      <FilterPanel
        {...context.filterPanelProps}
        headerText={strings.FiltersString}
        isLightDismiss={true}
      />
    </div>
  )
}

export * from './types'
