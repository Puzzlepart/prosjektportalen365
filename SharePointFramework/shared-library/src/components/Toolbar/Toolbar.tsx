import {
  FluentProvider,
  Toolbar as FluentToolbar,
  IdPrefixProvider,
  useId
} from '@fluentui/react-components'
import { FilterPanel } from '../FilterPanel'
import React, { FC } from 'react'
import { useToolbarItemRender } from './useToolbarItemRender'
import styles from './Toolbar.module.scss'
import { IToolbarProps } from './types'
import strings from 'SharedLibraryStrings'
import { customLightTheme } from '../../util'

export const Toolbar: FC<IToolbarProps> = (props) => {
  const fluentProviderId = useId('fp-toolbar')
  const { renderToolbarItem } = useToolbarItemRender()
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.root}>
        <FluentToolbar className={styles.toolbar}>
          {props.items.map((item, index) => (
            // A ListMenuItem has no key of its own; the toolbar's order is stable, so the index is one.
            <React.Fragment key={index}>{renderToolbarItem(item)}</React.Fragment>
          ))}
        </FluentToolbar>
        {props.farItems && (
          <FluentToolbar className={styles.toolbar}>
            {props.farItems.map((item, index) => (
              <React.Fragment key={index}>{renderToolbarItem(item)}</React.Fragment>
            ))}
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
