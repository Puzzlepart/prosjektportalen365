import { MessageBarType, ShimmeredDetailsList, SelectionMode, DetailsListLayoutMode } from '@fluentui/react'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import React, { FunctionComponent } from 'react'
import { ColumnContextMenu } from './ColumnContextMenu'
import { Commands } from './Commands'
import { ProgramAggregationContext } from './context'
import { getDefaultColumns, renderItemColumn } from './itemColumn'
import styles from './ProgramAggregation.module.scss'
import { COLUMN_HEADER_CONTEXT_MENU } from './reducer'
import SearchBox from './SearchBox'
import { IProgramAggregationProps } from './types'
import { useProgramAggregation } from './useProgramAggregation'

export const ProgramAggregation: FunctionComponent<IProgramAggregationProps> = (props) => {
  const { state, dispatch, items, ctxValue } = useProgramAggregation(props)

  if (state.error) {
    return <UserMessage type={MessageBarType.error} text={state.error.message} />
  }

  return (
    <ProgramAggregationContext.Provider value={ctxValue}>
      <div className={styles.root}>
        <Commands />
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
        </div>
        <SearchBox />
        <div className={styles.listContainer}>
          <ShimmeredDetailsList
            selectionMode={SelectionMode.none}
            layoutMode={DetailsListLayoutMode.fixedColumns}
            enableShimmer={state.loading}
            items={items.listItems}
            onRenderItemColumn={renderItemColumn}
            onColumnHeaderClick={(ev, col) => {
              dispatch(
                COLUMN_HEADER_CONTEXT_MENU({
                  column: col,
                  target: ev.currentTarget
                })
              )
            }}
            columns={[...getDefaultColumns(), ...items.columns].filter((c) => c)}
            groups={state.groups}
            compact={state.isCompact}
          />
        </div>
        <ColumnContextMenu />
      </div>
    </ProgramAggregationContext.Provider>
  )
}

ProgramAggregation.defaultProps = {
  showCommandBar: true,
  showExcelExportButton: true,
  showSearchBox: true
}

export * from './types'
