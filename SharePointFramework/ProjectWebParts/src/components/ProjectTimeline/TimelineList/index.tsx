import {
  CommandBar,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode
} from '@fluentui/react'
import React, { FC, useContext } from 'react'
import { ProjectTimelineContext } from '../context'
import styles from './TimelineList.module.scss'
import { useTimelineList } from './useTimelineList'

export const TimelineList: FC = () => {
  const context = useContext(ProjectTimelineContext)
  const {
    getCommandBarProps,
    onRenderItemColumn,
    selection,
    onColumnHeaderClick
  } = useTimelineList()
  return (
    <>
      <div className={styles.timelineList}>
        {context.props.showTimelineListCommands && (
          <div className={styles.commandBar}>
            <CommandBar {...getCommandBarProps()} />
          </div>
        )}
        <DetailsList
          columns={context.state.data.listColumns}
          items={context.state.data.listItems}
          onRenderItemColumn={onRenderItemColumn}
          selection={selection}
          selectionMode={SelectionMode.single}
          layoutMode={DetailsListLayoutMode.justified}
          onColumnHeaderClick={onColumnHeaderClick}
        />
      </div>
    </>
  )
}
