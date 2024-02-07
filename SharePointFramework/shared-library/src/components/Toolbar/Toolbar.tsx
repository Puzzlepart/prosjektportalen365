import {
  FluentProvider,
  Toolbar as FluentToolbar,
  IdPrefixProvider,
  useId
} from '@fluentui/react-components'
import { FilterPanel } from '../FilterPanel'
import React, { FC } from 'react'
import { renderToolbarItem } from './renderToolbarItem'
import styles from './Toolbar.module.scss'
import { IToolbarProps } from './types'
import strings from 'SharedLibraryStrings'
import { customLightTheme } from '../../util'

export const Toolbar: FC<IToolbarProps> = (props) => {
  const fluentProviderId = useId('fp-toolbar')
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.root}>
        <FluentToolbar className={styles.toolbar}>
          {props.items.map(renderToolbarItem)}
        </FluentToolbar>
        {props.farItems && (
          <FluentToolbar className={styles.toolbar}>
            {props.farItems.map(renderToolbarItem)}
          </FluentToolbar>
        )}
        {props.filterPanel && (
          <FilterPanel
            {...props.filterPanel}
            headerText={strings.FiltersString}
            isLightDismiss={true}
          />
        )}
      </FluentProvider>
    </IdPrefixProvider>
  )
}

Toolbar.displayName = 'Toolbar'
Toolbar.defaultProps = {
  items: [],
  farItems: []
}
