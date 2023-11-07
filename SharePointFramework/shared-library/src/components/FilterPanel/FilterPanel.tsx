import { Panel, PanelType } from '@fluentui/react'
import React, { FC } from 'react'
import { Filter } from './Filter/Filter'
import { IFilterPanelProps } from './types'
import styles from './FilterPanel.module.scss'
import { useId, IdPrefixProvider, FluentProvider, webLightTheme } from '@fluentui/react-components'

export const FilterPanel: FC<IFilterPanelProps> = (props) => {
  const fluentProviderId = useId('fp-filterPanel')

  return (
    <Panel {...props} type={PanelType.smallFixedFar}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={webLightTheme}>
          <div className={styles.filterPanel}>
            {props.filters
              .filter((f) => f.items.length > 1)
              .map((f, idx) => (
                <Filter {...f} key={idx} onFilterChange={props.onFilterChange} />
              ))}
          </div>
        </FluentProvider>
      </IdPrefixProvider>
    </Panel>
  )
}
