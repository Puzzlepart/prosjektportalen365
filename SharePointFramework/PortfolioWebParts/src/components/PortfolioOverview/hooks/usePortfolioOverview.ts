import { SearchBoxProps, useId } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { IFilterItemProps, IFilterPanelProps, ProjectColumn, format } from 'pp365-shared-library'
import { createElement, useCallback, useMemo, useReducer } from 'react'
import { OnColumnContextMenu } from '../../List'
import { IPortfolioOverviewContext } from '../context'
import createReducer, {
  EXECUTE_SEARCH,
  ON_FILTER_CHANGED,
  SELECTION_CHANGED,
  TOGGLE_COLUMN_CONTEXT_MENU,
  TOGGLE_FILTER_PANEL,
  getInitialState
} from '../reducer'
import { ResultsCount } from '../ResultsCount'
import { useToolbarItems } from '../ToolbarItems/useToolbarItems'
import { IPortfolioOverviewProps } from '../types'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import { useFetchData } from './useFetchData'
import { useFilteredData } from './useFilteredData'
import { usePersistedColumns } from './usePersistedColumns'
import { usePortfolioOverviewFilters } from './usePortfolioOverviewFilters'

/**
 * Component logic hook for `PortfolioOverview` component.
 *
 * - Handles state using `useReducer` and our custom `reducer` function
 * - Keeps the selected items, which the Excel export takes instead of all rows
 * - Fetches initial data using `useFetchInitialData`
 * - Gives the context the id of the toaster that reports a failed Excel export
 * - Handles column header click using `useColumnHeaderClick`
 * - Handles column header context menu using `useColumnHeaderContextMenu`
 * - Handles column persistence using `usePersistedColumns`
 */
export function usePortfolioOverview(props: IPortfolioOverviewProps) {
  const [placeholderColumns] = usePersistedColumns(props)
  const reducer = useMemo(() => createReducer({ props, placeholderColumns }), [])
  const [state, dispatch] = useReducer(reducer, getInitialState({ props, placeholderColumns }))

  const layerHostId = useId('layerHost')
  const toasterId = useId('toaster')

  const context: IPortfolioOverviewContext = useMemo(
    () => ({
      props,
      state,
      dispatch,
      layerHostId,
      toasterId
    }),
    [props, state, dispatch, layerHostId, toasterId]
  )

  const onSelectionChange = useCallback(
    (selectedItems: Record<string, any>[]) => dispatch(SELECTION_CHANGED(selectedItems)),
    [dispatch]
  )

  const onColumnContextMenu = (contextMenu: OnColumnContextMenu) => {
    context.dispatch(TOGGLE_COLUMN_CONTEXT_MENU(contextMenu))
  }

  useFetchData(context)

  const { items, groups } = useFilteredData(context)

  const editViewColumnsPanelProps = useEditViewColumnsPanel(context)

  const searchBox: SearchBoxProps = {
    placeholder: !!context.state.currentView
      ? format(strings.SearchBoxPlaceholderText, context.state.currentView.title)
      : strings.SearchBoxPlaceholderFallbackText,
    onChange: (_, data) => {
      context.dispatch(EXECUTE_SEARCH(data?.value))
    },
    hidden: !props.showSearchBox,
    contentAfter: createElement(ResultsCount, { displayCount: items.length })
  }

  const filters = usePortfolioOverviewFilters(context)
  const menuItems = useToolbarItems(context)

  const filterPanelProps: IFilterPanelProps = useMemo(
    () => ({
      open: context.state.isFilterPanelOpen,
      layerHostId: context.layerHostId,
      onClose: () => context.dispatch(TOGGLE_FILTER_PANEL()),
      filters: filters,
      onFilterChange: (column: ProjectColumn, selectedItems: IFilterItemProps[]) => {
        context.dispatch(ON_FILTER_CHANGED({ column, selectedItems }))
      }
    }),
    [context.state.isFilterPanelOpen, context.layerHostId, filters]
  )

  const contextValue = useMemo(
    () =>
      ({
        ...context,
        items,
        groups
      }) as IPortfolioOverviewContext,
    [context, items, groups]
  )

  return {
    context: contextValue,
    onSelectionChange,
    onColumnContextMenu,
    editViewColumnsPanelProps,
    searchBox,
    menuItems,
    filterPanelProps
  } as const
}
