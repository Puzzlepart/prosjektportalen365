import { FC, useContext, useEffect, useMemo } from 'react'
import * as React from 'react'
import { DynamicListContext } from './context'
import { IDynamicListProps, DynamicListMode, DocumentLibraryViewMode } from './types'
import { useDynamicList } from './useDynamicList'
import { DynamicListView } from './views/DynamicListView/DynamicListView'
import { DocumentLibraryView } from './views/DocumentLibraryView'
import { SingleItemView } from './views/SingleItemView/SingleItemView'
import { ColumnContextMenu } from './components/ColumnContextMenu'
import {
  WebPartTitle,
  CustomEditPanel,
  Toolbar,
  isHubSite,
  UserMessage,
  LoadingSkeleton
} from 'pp365-shared-library'
import { Spinner, Skeleton, SkeletonItem } from '@fluentui/react-components'
import { Web } from '@pnp/sp/webs'
import SPDataAdapter from '../../data'
import { useToolbarItems } from './useToolbarItems'
import styles from './DynamicList.module.scss'

/**
 * Internal component that renders the main content of the DynamicList.
 *
 * Handles rendering of the web part title, toolbar, loading states, and either
 * the DynamicListView or SingleItemView based on display mode.
 *
 * @param isSingleView Whether to display in single item view mode
 * @param showNewButton Whether to show the new item button
 * @param targetWeb The SharePoint web instance to use for operations
 */
const DynamicListContent: FC<{ isSingleView: boolean; showNewButton: boolean; targetWeb: any }> = ({
  isSingleView,
  showNewButton,
  targetWeb
}) => {
  const context = useContext(DynamicListContext)
  const { menuItems, farMenuItems, filterPanelProps } = useToolbarItems(isSingleView, showNewButton)

  if (!context.props.listName) {
    return (
      <>
        <div className={styles.header}>
          <WebPartTitle
            title={context.props.title || 'Dynamisk liste'}
            description={context.props.infoText}
          />
        </div>
        <div style={{ padding: '0 32px' }}>
          <UserMessage
            title='Ingen liste valgt'
            text='Vennligst velg en liste i webdel-egenskapene for å vise innhold.'
            intent='info'
          />
        </div>
      </>
    )
  }

  return (
    <>
      <div className={styles.header}>
        {context.state.isLoading ? (
          <Skeleton className={styles.headerSkeleton}>
            <SkeletonItem className={styles.titleSkeleton} />
          </Skeleton>
        ) : (
          <WebPartTitle
            title={context.props.title || context.state.data?.listTitle}
            description={context.props.infoText}
          />
        )}
      </div>
      {context.state.isRefetching ? (
        <Spinner
          size='extra-tiny'
          label='Oppdaterer og henter data på nytt...'
          style={{ padding: 10, minHeight: '20px' }}
        />
      ) : (
        context.props.showCommandBar && (
          <div className={styles.commandBar}>
            <Toolbar items={menuItems} farItems={farMenuItems} filterPanel={filterPanelProps} />
          </div>
        )
      )}
      {context.state.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {context.state.error && <div>Error: {context.state.error}</div>}
          {context.state.data && (
            <>
              {context.state.isDocumentLibrary ? (
                <DocumentLibraryView />
              ) : isSingleView ? (
                <SingleItemView />
              ) : (
                <DynamicListView />
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

/**
 * DynamicList web part component for displaying SharePoint list data.
 *
 * Provides a flexible list view with features including:
 * - Multi-view and single-view display modes
 * - Filtering, searching, and sorting capabilities
 * - Item selection and editing via CustomEditPanel
 * - Support for custom views and column configurations
 * - Integration with ProjectContentColumns for column metadata
 *
 * @param props Configuration properties for the DynamicList
 */
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

  const displayMode =
    props.mode || (props.maxItems === 1 ? DynamicListMode.Single : DynamicListMode.Multi)

  const hasOnlyOneItem = state.data?.listItems?.length === 1
  const isSingleView =
    displayMode === DynamicListMode.Single ||
    (displayMode === DynamicListMode.Multi && (hasOnlyOneItem || state.isDrilledDown))

  const showNewButton = displayMode === DynamicListMode.Multi

  // In single view mode, auto-select the first item so edit button is enabled
  useEffect(() => {
    if (isSingleView && state.data?.listItems?.length > 0 && !state.selectedItems?.length) {
      setState({ selectedItems: [0] })
    }
  }, [isSingleView, state.data?.listItems?.length, state.selectedItems?.length])

  /**
   * Determines the target SharePoint web instance based on webUrl prop.
   * Returns portal web if current site is a hub, otherwise returns current web or creates a Web instance.
   */
  const targetWeb = useMemo(() => {
    if (!props.webUrl) {
      if (props.pageContext && isHubSite(props.pageContext)) {
        return SPDataAdapter.portalDataService.web
      }
      return SPDataAdapter.sp.web
    } else {
      return Web([SPDataAdapter.sp.web, props.webUrl])
    }
  }, [props.webUrl, props.pageContext])

  return (
    <div className={styles.dynamicList}>
      <DynamicListContext.Provider value={context}>
        <div className={styles.container}>
          <DynamicListContent isSingleView={isSingleView} showNewButton={showNewButton} targetWeb={targetWeb} />
        </div>
        <ColumnContextMenu />
        {state.panel && (
          <CustomEditPanel
            isOpen={true}
            fields={state.data?.fields || []}
            fieldValues={state.panel.fieldValues}
            dataAdapter={SPDataAdapter}
            targetWeb={targetWeb}
            onDismiss={() => {
              setState({
                selectedItems: [],
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
  mode: DynamicListMode.Multi,
  documentLibraryViewMode: DocumentLibraryViewMode.Folders
}
