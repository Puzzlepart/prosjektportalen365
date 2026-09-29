import { FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import * as React from 'react'
import { FC, useContext } from 'react'
import styles from './TimelineList.module.scss'
import { useTimelineList } from './useTimelineList'
import { ProjectTimelineContext } from '../context'
import { DataGridList, Toolbar, customLightTheme } from 'pp365-shared-library'

export const TimelineList: FC = () => {
  const context = useContext(ProjectTimelineContext)
  const { columns, menuItems, farMenuItems, defaultSortState, onSelection, fluentProviderId } =
    useTimelineList()

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.timelineList}>
        {context.props.showTimelineListCommands && (
          <div className={styles.commandBar}>
            <div>
              <Toolbar items={menuItems} farItems={farMenuItems} />
            </div>
          </div>
        )}
        <div className={styles.scrollContainer}>
          <DataGridList
            items={context.state.data.listItems}
            columns={columns}
            sortable
            defaultSortState={defaultSortState}
            selectionMode='multiselect'
            selectedItems={context.state.selectedItems}
            onSelectionChange={onSelection}
            subtleSelection
          />
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
