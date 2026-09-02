import { Selection, format } from '@fluentui/react'
import { SearchBoxProps } from '@fluentui/react-components'
import { useId } from '@fluentui/react-hooks'
import strings from 'PortfolioWebPartsStrings'
import { IFilterItemProps, IFilterPanelProps, ProjectColumn } from 'pp365-shared-library'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { createElement, useEffect, useMemo, useReducer } from 'react'
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
 * - Handles selection changes using a stable `Selection` instance — v8
 *   `DetailsList` captures the `selection` prop in its constructor and never
 *   reconciles it, so recreating it per render desyncs `DetailsList` from
 *   `MarqueeSelection`
 * - Fetches initial data using `useFetchInitialData`
 * - Configures the `ExcelExportService` from `pp365-shared`
 * - Handles column header click using `useColumnHeaderClick`
 * - Handles column header context menu using `useColumnHeaderContextMenu`
 * - Handles column persistence using `usePersistedColumns`
 */
export function usePortfolioOverview(props: IPortfolioOverviewProps) {
  const [placeholderColumns] = usePersistedColumns(props)
  const reducer = useMemo(() => createReducer({ props, placeholderColumns }), [])
  const [state, dispatch] = useReducer(reducer, getInitialState({ props, placeholderColumns }))

  const layerHostId = useId('layerHost')

  const context: IPortfolioOverviewContext = useMemo(
    () => ({
      props,
      state,
      dispatch,
      layerHostId
    }),
    [props, state, dispatch, layerHostId]
  )

  const selection = useMemo(() => {
    const instance: Selection = new Selection({
      onSelectionChanged: () => dispatch(SELECTION_CHANGED(instance))
    })
    return instance
  }, [dispatch])

  const onColumnContextMenu = (contextMenu: OnColumnContextMenu) => {
    context.dispatch(TOGGLE_COLUMN_CONTEXT_MENU(contextMenu))
  }

  useFetchData(context)

  useEffect(() => {
    ExcelExportService.configure({ name: props.title })
  }, [props.title])

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
      isOpen: context.state.isFilterPanelOpen,
      layerHostId: context.layerHostId,
      onDismiss: () => context.dispatch(TOGGLE_FILTER_PANEL()),
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
      } as IPortfolioOverviewContext),
    [context, items, groups]
  )

  return {
    context: contextValue,
    selection,
    onColumnContextMenu,
    editViewColumnsPanelProps,
    searchBox,
    menuItems,
    filterPanelProps
  } as const
}
