import { FC, useMemo } from 'react'
import * as React from 'react'
import { DynamicListContext } from './context'
import { IDynamicListProps, DynamicListMode } from './types'
import { useDynamicList } from './useDynamicList'
import { DynamicListView } from './views/DynamicListView/DynamicListView'
import { SingleItemView } from './views/SingleItemView/SingleItemView'
import { WebPartTitle, ItemFieldValues, CustomEditPanel, Toolbar } from 'pp365-shared-library'
import SPDataAdapter from '../../data'
import { useToolbarItems } from './useToolbarItems'
import styles from './DynamicList.module.scss'

const DynamicListContent: FC<{ isSingleView: boolean }> = ({ isSingleView }) => {
  const context = React.useContext(DynamicListContext)
  const { menuItems, farMenuItems } = useToolbarItems(isSingleView)

  return (
    <>
      <div className={styles.header}>
        <WebPartTitle
          title={context.props.title || context.state.data?.listTitle}
          description={context.props.infoText}
        />
      </div>
      {context.props.showCommandBar && (
        <div className={styles.commandBar}>
          <Toolbar items={menuItems} farItems={farMenuItems} />
        </div>
      )}
      {context.state.isLoading && <div>Loading...</div>}
      {context.state.error && <div>Error: {context.state.error}</div>}
      {!context.state.isLoading && !context.state.error && context.state.data && (
        <>{isSingleView ? <SingleItemView /> : <DynamicListView />}</>
      )}
    </>
  )
}

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

  const isSingleView = displayMode === DynamicListMode.Single

  return (
    <div className={styles.dynamicList}>
      <DynamicListContext.Provider value={context}>
        <div className={styles.container}>
          <DynamicListContent isSingleView={isSingleView} />
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
