import { FC, useMemo } from 'react'
import * as React from 'react'
import { DynamicListContext } from './context'
import { IDynamicListProps, DynamicListMode } from './types'
import { useDynamicList } from './useDynamicList'
import { DynamicListView } from './DynamicListView'
import { SingleItemView } from './SingleItemView'
import { WebPartTitle, ItemFieldValues, CustomEditPanel } from 'pp365-shared-library'
import SPDataAdapter from '../../data'
import styles from './DynamicList.module.scss'

export const DynamicList: FC<IDynamicListProps> = (props) => {
  const { state, setState } = useDynamicList(props)

  const context = useMemo(
    () => ({
      props,
      state,
      setState
    }),
    [props, state]
  )

  // Determine display mode
  const displayMode =
    props.mode || (props.maxItems === 1 ? DynamicListMode.Single : DynamicListMode.Multi)

  return (
    <div className={styles.dynamicList}>
      <DynamicListContext.Provider value={context}>
        <div className={styles.container}>
          <div className={styles.header}>
            <WebPartTitle
              title={props.title || state.data?.listTitle}
              description={props.infoText}
            />
          </div>
          {state.isLoading && <div>Loading...</div>}
          {state.error && <div>Error: {state.error}</div>}
          {!state.isLoading && !state.error && state.data && (
            <>{displayMode === DynamicListMode.Single ? <SingleItemView /> : <DynamicListView />}</>
          )}
        </div>
        {state.panel && (
          <CustomEditPanel
            isOpen={true}
            fields={state.data?.fields}
            fieldValues={new ItemFieldValues()}
            dataAdapter={SPDataAdapter}
            targetWeb={SPDataAdapter.sp.web}
            onDismiss={() => {
              setState({
                panel: null
              })
            }}
            {...state.panel}
          />
        )}
      </DynamicListContext.Provider>
    </div>
  )
}

DynamicList.defaultProps = {
  showCommandBar: true,
  showSearchBox: true,
  showViewSelector: true,
  showFilters: false,
  pageSize: 30,
  maxItems: 0,
  mode: DynamicListMode.Multi
}
