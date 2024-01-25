import { Panel, PanelType } from '@fluentui/react'
import React, { FC } from 'react'
import { Filter } from './Filter/Filter'
import { IFilterPanelProps } from './types'
import styles from './FilterPanel.module.scss'
import { useId, IdPrefixProvider, FluentProvider } from '@fluentui/react-components'
import { customLightTheme } from '../../util'
import { UserMessage } from '../UserMessage'
import strings from 'SharedLibraryStrings'

export const FilterPanel: FC<IFilterPanelProps> = (props) => {
  const fluentProviderId = useId('fp-filter-panel')

  return (
    <Panel {...props} type={PanelType.smallFixedFar}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <div className={styles.filterPanel}>
            {props.filters.length === 0 && (
              <UserMessage
                title={strings.FilterPanelEmptyTitle}
                text={strings.FilterPanelEmptyMessage}
                intent='info'
              />
            )}
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
