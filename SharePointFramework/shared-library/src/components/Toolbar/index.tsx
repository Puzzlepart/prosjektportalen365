import { FluentProvider, Toolbar as FluentToolbar, webLightTheme } from '@fluentui/react-components'
import { FilterPanel } from '../FilterPanel'
import React, { FC } from 'react'
import { renderToolbarItem } from './renderToolbarItem'
import styles from './Toolbar.module.scss'
import { IToolbarProps } from './types'
import strings from 'SharedLibraryStrings'

/**
 * Renders a `Toolbar` component from `@fluentui/react-components` with
 * the specified `items`. Conditionally renders a `FilterPanel` component
 * with the specified `filterPanel` props.
 * 
 * @param props Component properties
 */
export const Toolbar: FC<IToolbarProps> = (props) => {
  return (
    <FluentProvider theme={webLightTheme}>
      <FluentToolbar className={styles.toolbar}>{props.items.map(renderToolbarItem)}</FluentToolbar>
      {props.filterPanel && (
        <FilterPanel
          {...props.filterPanel}
          headerText={strings.FiltersString}
          isLightDismiss={true}
        />
      )}
    </FluentProvider>
  )
}

Toolbar.defaultProps = {
  items: []
}

export * from './types'
