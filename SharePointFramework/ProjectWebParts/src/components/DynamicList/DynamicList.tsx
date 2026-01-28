import { FC, useContext, useEffect, useMemo } from 'react'
import * as React from 'react'
import { DynamicListContext } from './context'
import {
  IDynamicListProps,
  DynamicListMode,
  DocumentLibraryViewMode,
  WebContextMode
} from './types'
import { useDynamicList } from './useDynamicList'
import { getWeb } from './utils'
import { DynamicListView } from './views/DynamicListView/DynamicListView'
import { DocumentLibraryView } from './views/DocumentLibraryView'
import { SingleItemView } from './views/SingleItemView/SingleItemView'
import {
  WebPartTitle,
  CustomEditPanel,
  Toolbar,
  UserMessage,
  LoadingSkeleton
} from 'pp365-shared-library'
import { Spinner, Skeleton, SkeletonItem } from '@fluentui/react-components'
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
const DynamicListContent: FC<{
  isSingleView: boolean
  showNewButton: boolean
  targetWeb: any
}> = ({ isSingleView, showNewButton, targetWeb }) => {
  const context = useContext(DynamicListContext)
  const { menuItems, farMenuItems, filterPanelProps, customActionDialog, toaster } =
    useToolbarItems(isSingleView, showNewButton)

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
            title={
              (context.props.title?.trim() || context.state.data?.listTitle) ?? 'Dynamisk liste'
            }
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
          {context.state.data?.siteIdFieldMissing && (
            <div style={{ padding: '0 32px', marginBottom: '16px' }}>
              <UserMessage
                title='Område-id relaterte felter ikke funnet'
                text='Område-id (GtSiteId) og Område tittel (GtSiteTitle) feltene må finnes på liste/dokumentbiblioteket for å ta i bruk denne funksjonaliteten. Bruk knappen i webdel-egenskapene for å legge til feltene, eller opprett dette manuelt på listen/dokumentbiblioteket.'
                intent='warning'
              />
            </div>
          )}
          {context.state.data && (
            <>
              {isSingleView ? (
                <SingleItemView />
              ) : context.state.isDocumentLibrary ? (
                <DocumentLibraryView />
              ) : (
                <DynamicListView />
              )}
            </>
          )}
        </>
      )}
      {customActionDialog}
      {toaster}
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
  /**
   * Determines the target SharePoint web instance based on webContextMode prop.
   * This web is used for ALL operations (read and write) and points to where the list exists.
   * - CurrentProject: Uses current site web
   * - HubSite: Uses portal data service web (hub site)
   * - CustomSite: Uses custom URL if provided
   */
  const targetWeb = useMemo(() => {
    return getWeb(props.webUrl, props.webContextMode)
  }, [props.webContextMode, props.webUrl])

  const { state, setState } = useDynamicList(props, targetWeb)

  const context = useMemo(
    () => ({
      props,
      state,
      setState,
      web: targetWeb
    }),
    [props, state, targetWeb]
  )

  const hasOnlyOneItem = state.data?.listItems?.length === 1
  const hasNoItems = state.data?.listItems?.length === 0
  const isSingleView =
    props.mode === DynamicListMode.Single ||
    (props.mode === DynamicListMode.Multi && (hasOnlyOneItem || state.isDrilledDown))

  const showNewButton =
    props.mode === DynamicListMode.Multi || (props.mode === DynamicListMode.Single && hasNoItems)

  useEffect(() => {
    if (isSingleView && state.data?.listItems?.length > 0 && !state.selectedItems?.length) {
      setState({ selectedItems: [0] })
    }
  }, [isSingleView, state.data?.listItems?.length, state.selectedItems?.length])

  /**
   * Filter fields for edit panel - exclude hidden columns unless they are required
   */
  const editPanelFields = useMemo(() => {
    if (!state.data?.fields) return []

    return state.data.fields.filter((field) => {
      const fieldName = field.InternalName || field.displayName
      const isHidden = props.hiddenColumns?.includes(fieldName)
      const isRequired = field.Required === true

      return !isHidden || isRequired
    })
  }, [state.data?.fields, props.hiddenColumns])

  /**
   * Create a data adapter that uses the correct SP instance based on webContextMode.
   * For HubSite mode, we use portalDataService which points to the hub site.
   * For other modes, we use the standard SPDataAdapter.
   */
  const dataAdapterForEditPanel = useMemo(() => {
    if (props.webContextMode === WebContextMode.HubSite) {
      return {
        ...SPDataAdapter,
        sp: SPDataAdapter.portalDataService as any
      } as typeof SPDataAdapter
    }
    return SPDataAdapter
  }, [props.webContextMode])

  const containerStyle = useMemo(() => {
    if (props.minHeight !== undefined) {
      const minHeight =
        typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight
      return { minHeight }
    }
    return undefined
  }, [props.minHeight])

  return (
    <div className={styles.dynamicList} style={containerStyle}>
      <DynamicListContext.Provider value={context}>
        <div className={styles.container} style={containerStyle}>
          <DynamicListContent
            isSingleView={isSingleView}
            showNewButton={showNewButton}
            targetWeb={targetWeb}
          />
        </div>
        {/* <ColumnContextMenu /> */}
        {state.panel && (
          <CustomEditPanel
            isOpen={true}
            fields={editPanelFields}
            fieldValues={state.panel.fieldValues}
            dataAdapter={dataAdapterForEditPanel}
            targetWeb={targetWeb}
            targetListId={state.data.listId}
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
  mode: DynamicListMode.Multi,
  documentLibraryViewMode: DocumentLibraryViewMode.Folders,
  useProjectContentColumnNames: true,
  showItemTitle: true,
  showCommandBar: true,
  showSearchBox: true,
  showViewSelector: false,
  showFilters: true,
  showNewButton: true,
  showEditButton: true,
  showDeleteButton: false,
  showRefreshButton: true,
  showExportButton: true,
  showUploadButton: true,
  showNewWordButton: false,
  showNewExcelButton: false,
  showNewPowerPointButton: false,
  showViewModeToggle: true
}
